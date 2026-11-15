// Baut aus einer Stripe-Checkout-Sitzung eine Bestellung. NUR auf dem Server verwenden.

import {
  sessionShipping,
  stripeRequest,
  type CheckoutSession,
  type StripeAddress,
  type StripeLineItem,
} from './stripe';
import { orderNumberFor, type Order, type OrderItem, type OrderStatus } from './orders';

const formatAddress = (a?: StripeAddress | null) =>
  a
    ? [a.line1, a.line2, [a.postal_code, a.city].filter(Boolean).join(' '), a.state, a.country]
        .filter((x) => x && String(x).trim())
        .join('\n')
    : '';

export async function getSession(sessionId: string): Promise<CheckoutSession | null> {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return null;
  const r = await stripeRequest<CheckoutSession>('GET', `/checkout/sessions/${sessionId}`);
  return r.ok ? r.data : null;
}

async function paymentMethodOf(session: CheckoutSession): Promise<string> {
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!pi) return '';
  const params = new URLSearchParams();
  params.append('expand[]', 'latest_charge');
  params.append('expand[]', 'payment_method');
  const r = await stripeRequest<{
    payment_method?: { type?: string } | null;
    latest_charge?: { payment_method_details?: { type?: string } } | null;
  }>('GET', `/payment_intents/${pi}`, params);
  if (!r.ok) return '';
  return r.data.latest_charge?.payment_method_details?.type ?? r.data.payment_method?.type ?? '';
}

export async function buildOrder(session: CheckoutSession, status: OrderStatus): Promise<Order> {
  const params = new URLSearchParams({ limit: '100' });
  const li = await stripeRequest<{ data: StripeLineItem[] }>('GET', `/checkout/sessions/${session.id}/line_items`, params);
  const lineItems = li.ok ? li.data.data : [];

  const meta = session.metadata ?? {};
  const n = Number(meta.items_n ?? 0);
  const raw = Array.from({ length: n }, (_, i) => meta[`items_${i}`] ?? '').join('');
  const parsed = raw
    .split(';')
    .filter(Boolean)
    .map((s) => {
      const [slug, size, color, qty] = s.split('|');
      return { slug, size, color, qty: Number(qty) };
    });

  const items: OrderItem[] = lineItems.map((l, i) => {
    const m = parsed[i];
    const quantity = l.quantity ?? m?.qty ?? 1;
    const unit = (l.price?.unit_amount ?? Math.round(l.amount_total / quantity)) / 100;
    return {
      slug: m?.slug ?? '',
      name: l.description ?? m?.slug ?? '',
      size: m?.size ?? '',
      color: m?.color ?? '',
      quantity,
      unitPrice: unit,
      lineTotal: l.amount_total / 100,
    };
  });

  const ship = sessionShipping(session);
  const cust = session.customer_details ?? {};
  return {
    orderNumber: orderNumberFor(session.id, session.created),
    status,
    testMode: !session.livemode,
    locale: meta.locale ?? session.locale ?? 'de',
    createdAt: new Date(session.created * 1000).toISOString(),
    email: cust.email ?? '',
    customerName: cust.name ?? '',
    phone: cust.phone ?? '',
    shippingName: ship?.name ?? cust.name ?? '',
    shippingAddress: formatAddress(ship?.address ?? cust.address),
    address: {
      line1: (ship?.address ?? cust.address)?.line1 ?? '',
      line2: (ship?.address ?? cust.address)?.line2 ?? '',
      postalCode: (ship?.address ?? cust.address)?.postal_code ?? '',
      city: (ship?.address ?? cust.address)?.city ?? '',
      country: (ship?.address ?? cust.address)?.country ?? meta.country ?? '',
    },
    country: ship?.address?.country ?? meta.country ?? '',
    items,
    subtotal: (session.amount_subtotal ?? 0) / 100,
    shipping: (session.total_details?.amount_shipping ?? 0) / 100,
    total: (session.amount_total ?? 0) / 100,
    currency: (session.currency ?? 'eur').toUpperCase(),
    paymentMethod: await paymentMethodOf(session),
    stripeSessionId: session.id,
    stripePaymentIntent:
      (typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id) ?? '',
  };
}
