// Bestellungen speichern (in Sanity) und Bestand abbuchen. NUR auf dem Server verwenden.
//
// Datenschutz: Bestellungen bekommen eine Dokument-ID mit Punkt ("orders.HK-…").
// Dokumente mit Punkt in der ID sind bei Sanity NICHT öffentlich lesbar, auch wenn das
// Dataset öffentlich ist – nur angemeldete Studio-Nutzer und der Schreib-Token sehen sie.
// (Nach der Einrichtung prüfen, siehe README → „Bestellungen prüfen“.)

import { apiVersion, dataset, isSanityConfigured, projectId } from '@/sanity/env';

export type OrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'payment_failed'
  | 'shipped'
  | 'delivered'
  | 'refunded'
  | 'partially_refunded'
  | 'cancelled';

export interface OrderItem {
  slug: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number; // €
  lineTotal: number; // €
}

export interface Order {
  orderNumber: string;
  status: OrderStatus;
  testMode: boolean;
  locale: string;
  createdAt: string;
  email: string;
  customerName: string;
  phone: string;
  shippingName: string;
  shippingAddress: string; // mehrzeilig
  address: {
    line1: string;
    line2: string;
    postalCode: string;
    city: string;
    country: string;
  };
  country: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  paymentMethod: string;
  stripeSessionId: string;
  stripePaymentIntent: string;
}

const writeToken = () => process.env.SANITY_API_WRITE_TOKEN?.trim() ?? '';
export const canStoreOrders = () => isSanityConfigured && writeToken().length > 0;

export const orderDocId = (orderNumber: string) => `orders.${orderNumber}`;

// Bestellnummer aus der Stripe-Sitzung ableiten: gleiche Sitzung → gleiche Nummer.
// Dadurch entsteht keine doppelte Bestellung, falls Stripe ein Ereignis zweimal schickt.
export function orderNumberFor(sessionId: string, created: number): string {
  const d = new Date(created * 1000);
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  return `HK-${ymd}-${sessionId.slice(-6).toUpperCase()}`;
}

async function sanityQuery<T>(groq: string, params: Record<string, unknown> = {}): Promise<T> {
  const qs = new URLSearchParams({ query: groq });
  for (const [k, v] of Object.entries(params)) qs.set(`$${k}`, JSON.stringify(v));
  const res = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?${qs}`, {
    headers: { Authorization: `Bearer ${writeToken()}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Sanity-Abfrage fehlgeschlagen (${res.status})`);
  return ((await res.json()) as { result: T }).result;
}

async function sanityMutate(mutations: unknown[]): Promise<void> {
  const res = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}?visibility=sync`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${writeToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mutations }),
      cache: 'no-store',
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Sanity-Speichern fehlgeschlagen (${res.status}) ${text.slice(0, 300)}`);
  }
}

interface StoredOrderState {
  status?: OrderStatus;
  stockAdjusted?: boolean;
}

export async function getStoredOrder(orderNumber: string): Promise<StoredOrderState | null> {
  if (!canStoreOrders()) return null;
  return sanityQuery<StoredOrderState | null>(`*[_id == $id][0]{ status, stockAdjusted }`, {
    id: orderDocId(orderNumber),
  });
}

// Legt die Bestellung an (falls neu) und setzt den Status.
// Bei Status "paid" wird der Bestand genau einmal abgebucht.
// Rückgabe: ob die Bestellung neu ist und ob der Bestand in diesem Aufruf abgebucht wurde
// (so werden E-Mails nicht doppelt verschickt, falls Stripe ein Ereignis wiederholt).
export async function saveOrder(
  order: Order
): Promise<{ stored: boolean; newlyPaid: boolean; created: boolean }> {
  if (!canStoreOrders()) {
    // Ohne Schreib-Token wird die Bestellung nur im Server-Protokoll vermerkt.
    console.warn('[Bestellung] Nicht gespeichert – SANITY_API_WRITE_TOKEN fehlt.', order.orderNumber);
    return { stored: false, newlyPaid: order.status === 'paid', created: true };
  }
  const id = orderDocId(order.orderNumber);
  const existing = await getStoredOrder(order.orderNumber);

  const doc = {
    _id: id,
    _type: 'order',
    ...order,
    items: order.items.map((it, i) => ({ _key: `i${i}`, _type: 'orderItem', ...it })),
    stockAdjusted: false,
  };

  const mutations: unknown[] = [{ createIfNotExists: doc }];
  const alreadyPaid = existing?.stockAdjusted === true;
  // Status nicht "zurückdrehen", wenn die Bestellung schon bezahlt/versendet ist
  const keepStatus =
    existing?.status === 'paid' ||
    existing?.status === 'shipped' ||
    existing?.status === 'delivered' ||
    existing?.status === 'refunded' ||
    existing?.status === 'partially_refunded' ||
    existing?.status === 'cancelled';
  if (!keepStatus) {
    mutations.push({ patch: { id, set: { status: order.status, paymentMethod: order.paymentMethod } } });
  }

  let newlyPaid = false;
  if (order.status === 'paid' && !alreadyPaid) {
    newlyPaid = true;
    mutations.push({ patch: { id, set: { stockAdjusted: true, paidAt: new Date().toISOString() } } });
    // Bestand je Produkt reduzieren
    const qtyBySlug = new Map<string, number>();
    for (const it of order.items) qtyBySlug.set(it.slug, (qtyBySlug.get(it.slug) ?? 0) + it.quantity);
    const ids = await sanityQuery<{ _id: string; slug: string }[]>(
      `*[_type == "product" && slug.current in $slugs && !(_id in path("drafts.**"))]{ _id, "slug": slug.current }`,
      { slugs: [...qtyBySlug.keys()] }
    );
    for (const p of ids) {
      mutations.push({ patch: { id: p._id, dec: { stock: qtyBySlug.get(p.slug) ?? 0 } } });
    }
  }

  await sanityMutate(mutations);
  return { stored: true, newlyPaid, created: existing === null };
}

export async function setOrderStatus(orderNumber: string, status: OrderStatus): Promise<void> {
  if (!canStoreOrders()) return;
  await sanityMutate([{ patch: { id: orderDocId(orderNumber), set: { status } } }]);
}

// ---------- Versand ----------

export interface ShippingOrder extends Order {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  trackingState?: string;
  trackingDescription?: string;
  trackingUpdatedAt?: string;
  shippedAt?: string;
  labelCreatedInMode?: string;
  hasLabel?: boolean;
}

const ORDER_FIELDS = `orderNumber, status, testMode, locale, createdAt, email, customerName, phone,
  shippingName, shippingAddress, address, country, items, subtotal, shipping, total, currency,
  paymentMethod, stripeSessionId, stripePaymentIntent, carrier, trackingNumber, trackingUrl,
  trackingState, trackingDescription, trackingUpdatedAt, shippedAt, labelCreatedInMode,
  "hasLabel": defined(labelPdf)`;

export async function listOrders(statuses: OrderStatus[], limit = 100): Promise<ShippingOrder[]> {
  if (!canStoreOrders()) return [];
  return sanityQuery<ShippingOrder[]>(
    `*[_type == "order" && status in $statuses] | order(createdAt desc)[0...$limit]{ ${ORDER_FIELDS} }`,
    { statuses, limit }
  );
}

export async function getOrder(orderNumber: string): Promise<ShippingOrder | null> {
  if (!canStoreOrders()) return null;
  return sanityQuery<ShippingOrder | null>(`*[_id == $id][0]{ ${ORDER_FIELDS} }`, { id: orderDocId(orderNumber) });
}

export async function getLabelPdf(orderNumber: string): Promise<string | null> {
  if (!canStoreOrders()) return null;
  return sanityQuery<string | null>(`*[_id == $id][0].labelPdf`, { id: orderDocId(orderNumber) });
}

// Etikett speichern (Status bleibt "bezahlt", bis das Paket wirklich übergeben ist)
export async function saveLabel(orderNumber: string, data: { carrier: string; trackingNumber: string; trackingUrl: string; labelPdf: string; mode: string }) {
  await sanityMutate([
    {
      patch: {
        id: orderDocId(orderNumber),
        set: {
          carrier: data.carrier,
          trackingNumber: data.trackingNumber,
          trackingUrl: data.trackingUrl,
          labelPdf: data.labelPdf,
          labelCreatedInMode: data.mode,
          labelCreatedAt: new Date().toISOString(),
        },
      },
    },
  ]);
}

export async function markShipped(orderNumber: string, data: { carrier: string; trackingNumber: string; trackingUrl: string }) {
  await sanityMutate([
    {
      patch: {
        id: orderDocId(orderNumber),
        set: { ...data, status: 'shipped', shippedAt: new Date().toISOString() },
      },
    },
  ]);
}

export async function updateTracking(orderNumber: string, state: string, description: string) {
  const set: Record<string, string> = {
    trackingState: state,
    trackingDescription: description,
    trackingUpdatedAt: new Date().toISOString(),
  };
  if (state === 'delivered') {
    set.status = 'delivered';
    set.deliveredAt = new Date().toISOString();
  }
  await sanityMutate([{ patch: { id: orderDocId(orderNumber), set } }]);
}

// Erstattung (aus dem Stripe-Webhook "charge.refunded"): Bestellung über die Zahlung finden
export async function markRefunded(paymentIntent: string, full: boolean, refundedEuro: number): Promise<string | null> {
  if (!canStoreOrders() || !paymentIntent) return null;
  const id = await sanityQuery<string | null>(
    `*[_type == "order" && stripePaymentIntent == $pi][0]._id`,
    { pi: paymentIntent }
  );
  if (!id) return null;
  await sanityMutate([
    {
      patch: {
        id,
        set: {
          status: full ? 'refunded' : 'partially_refunded',
          refundedAmount: refundedEuro,
          refundedAt: new Date().toISOString(),
        },
      },
    },
  ]);
  return id;
}
