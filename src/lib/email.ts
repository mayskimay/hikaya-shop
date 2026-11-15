// Bestell-E-Mails über Resend (resend.com). NUR auf dem Server verwenden.
// Benötigte Umgebungsvariablen: RESEND_API_KEY, ORDER_EMAIL_FROM, ORDER_NOTIFY_EMAIL
// Ist nichts eingerichtet, werden keine E-Mails verschickt (nur ein Hinweis im Protokoll).

import type { Order } from './orders';
import { getShopConfig, type ShopConfig } from './settings';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const money = (v: number, locale: string) =>
  new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'de-AT', { style: 'currency', currency: 'EUR' }).format(v);

export const emailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY?.trim() && process.env.ORDER_EMAIL_FROM?.trim());

async function send(to: string, subject: string, html: string, replyTo?: string) {
  if (!emailConfigured()) {
    console.warn('[E-Mail] Nicht versendet – RESEND_API_KEY / ORDER_EMAIL_FROM fehlen:', subject);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ORDER_EMAIL_FROM,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) console.error('[E-Mail] Versand fehlgeschlagen', res.status, await res.text().catch(() => ''));
}

function itemsTable(order: Order, cfg: ShopConfig) {
  const l = order.locale;
  const rows = order.items
    .map(
      (it) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(it.name)}<br><span style="color:#888;font-size:13px">${esc(it.size)} · ${esc(it.color)} · ×${it.quantity}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${money(it.lineTotal, l)}</td></tr>`
    )
    .join('');
  const de = l !== 'en';
  return `<table style="width:100%;border-collapse:collapse;font-size:15px">${rows}
    <tr><td style="padding:8px 0">${de ? 'Zwischensumme' : 'Subtotal'}</td><td style="text-align:right">${money(order.subtotal, l)}</td></tr>
    <tr><td style="padding:4px 0">${de ? 'Versand' : 'Shipping'}</td><td style="text-align:right">${money(order.shipping, l)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold">${de ? 'Gesamt' : 'Total'}</td><td style="text-align:right;font-weight:bold">${money(order.total, l)}</td></tr>
  </table>
  <p style="color:#888;font-size:12px">${esc(cfg.vatNote[de ? 'de' : 'en'])}</p>`;
}

function layout(title: string, body: string, testMode: boolean, cfg: ShopConfig) {
  const c = cfg.company;
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2b2630;line-height:1.6">
    ${testMode ? '<p style="background:#fff3cd;padding:8px 12px;font-family:Arial,sans-serif;font-size:13px">TESTMODUS – keine echte Bestellung / TEST MODE – not a real order</p>' : ''}
    <h1 style="font-weight:normal;letter-spacing:.2em;font-size:22px">HIKAYA</h1>
    <h2 style="font-weight:normal;font-size:20px">${esc(title)}</h2>
    <div style="font-family:Arial,sans-serif;font-size:15px">${body}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#888">${esc(c.name)} · ${esc(c.address)} · ${esc(c.email)}${c.uid ? ` · UID ${esc(c.uid)}` : ''}</p>
  </div>`;
}

// Bestätigung an die Kundin
export async function sendCustomerConfirmation(order: Order, kind: 'paid' | 'pending' | 'payment_confirmed') {
  if (!order.email) return;
  const cfg = await getShopConfig();
  const de = order.locale !== 'en';
  const shopUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
  const titles = {
    paid: de ? 'Danke für deine Bestellung' : 'Thank you for your order',
    pending: de ? 'Deine Bestellung ist eingegangen' : 'We have received your order',
    payment_confirmed: de ? 'Deine Zahlung ist bestätigt' : 'Your payment is confirmed',
  };
  const intro = {
    paid: de
      ? `Wir haben deine Bestellung <b>${esc(order.orderNumber)}</b> erhalten und die Zahlung ist eingegangen. Wir melden uns, sobald dein Paket unterwegs ist.`
      : `We have received your order <b>${esc(order.orderNumber)}</b> and your payment. We will let you know as soon as your parcel is on its way.`,
    pending: de
      ? `Wir haben deine Bestellung <b>${esc(order.orderNumber)}</b> erhalten. Deine Zahlung wird noch von der Bank bestätigt (das kann bei Lastschrift einige Tage dauern). Wir versenden, sobald die Zahlung eingegangen ist.`
      : `We have received your order <b>${esc(order.orderNumber)}</b>. Your payment is still being confirmed by the bank (this can take a few days for direct debit). We will ship as soon as the payment has arrived.`,
    payment_confirmed: de
      ? `Die Zahlung für deine Bestellung <b>${esc(order.orderNumber)}</b> ist eingegangen. Wir bereiten den Versand vor.`
      : `The payment for your order <b>${esc(order.orderNumber)}</b> has arrived. We are preparing your shipment.`,
  };
  const legal = de
    ? `<p style="font-size:13px;color:#666">Informationen zu deinem Widerrufsrecht findest du in unseren <a href="${shopUrl}/de/info/returns">Rückgabe- und Widerrufsbedingungen</a> sowie in den <a href="${shopUrl}/de/info/terms">AGB</a>. <i>(Platzhalter – Widerrufsbelehrung und Muster-Widerrufsformular rechtlich prüfen lassen und ggf. als Anhang mitsenden.)</i></p>`
    : `<p style="font-size:13px;color:#666">Information about your right of withdrawal is in our <a href="${shopUrl}/en/info/returns">returns & withdrawal policy</a> and <a href="${shopUrl}/en/info/terms">terms</a>. <i>(Placeholder – withdrawal information and model form to be legally reviewed.)</i></p>`;
  const body = `<p>${intro[kind]}</p>
    ${kind !== 'payment_confirmed' ? itemsTable(order, cfg) : ''}
    ${kind !== 'payment_confirmed' ? `<p><b>${de ? 'Lieferadresse' : 'Delivery address'}</b><br>${esc(order.shippingName)}<br>${esc(order.shippingAddress).replace(/\n/g, '<br>')}</p>` : ''}
    ${legal}`;
  const subject = `${titles[kind]} – ${order.orderNumber}${order.testMode ? ' [TEST]' : ''}`;
  await send(order.email, subject, layout(titles[kind], body, order.testMode, cfg), process.env.ORDER_NOTIFY_EMAIL || undefined);
}

// Benachrichtigung an die Inhaberin
export async function sendOwnerNotification(order: Order) {
  const to = process.env.ORDER_NOTIFY_EMAIL?.trim();
  if (!to) return;
  const cfg = await getShopConfig();
  const status = order.status === 'paid' ? 'BEZAHLT – bitte versenden' : 'Zahlung ausstehend (Lastschrift) – noch nicht versenden';
  const body = `<p><b>${esc(status)}</b></p>
    <p>${esc(order.customerName)} · ${esc(order.email)}${order.phone ? ` · ${esc(order.phone)}` : ''}</p>
    <p><b>Lieferadresse</b><br>${esc(order.shippingName)}<br>${esc(order.shippingAddress).replace(/\n/g, '<br>')}</p>
    ${itemsTable({ ...order, locale: 'de' }, cfg)}
    <p>Zahlungsart: ${esc(order.paymentMethod || '–')}<br>Stripe-Sitzung: ${esc(order.stripeSessionId)}</p>
    <p>Alle Bestellungen siehst du im Studio unter <i>Bestellung</i>.</p>`;
  await send(
    to,
    `Neue Bestellung ${order.orderNumber} – ${money(order.total, 'de')}${order.testMode ? ' [TEST]' : ''}`,
    layout('Neue Bestellung', body, order.testMode, cfg),
    order.email || undefined
  );
}

// Versandbestätigung mit Sendungsverfolgung an die Kundin
export async function sendShippingConfirmation(
  order: Order,
  shipment: { carrier: string; trackingNumber: string; trackingUrl: string }
) {
  if (!order.email) return;
  const cfg = await getShopConfig();
  const de = order.locale !== 'en';
  const title = de ? 'Deine Bestellung ist unterwegs' : 'Your order is on its way';
  const body = `<p>${
    de
      ? `Deine Bestellung <b>${esc(order.orderNumber)}</b> wurde an ${esc(shipment.carrier)} übergeben.`
      : `Your order <b>${esc(order.orderNumber)}</b> has been handed over to ${esc(shipment.carrier)}.`
  }</p>
  <p>${de ? 'Sendungsnummer' : 'Tracking number'}: <b>${esc(shipment.trackingNumber)}</b></p>
  ${shipment.trackingUrl ? `<p><a href="${esc(shipment.trackingUrl)}" style="display:inline-block;background:#4A3B4F;color:#fff;padding:12px 22px;text-decoration:none;border-radius:999px">${de ? 'Sendung verfolgen' : 'Track your parcel'}</a></p>` : ''}
  <p><b>${de ? 'Lieferadresse' : 'Delivery address'}</b><br>${esc(order.shippingName)}<br>${esc(order.shippingAddress).replace(/\n/g, '<br>')}</p>
  <p style="font-size:13px;color:#666">${
    de
      ? 'Es kann einige Stunden dauern, bis die Sendung bei DHL sichtbar ist.'
      : 'It may take a few hours until the shipment is visible at DHL.'
  }</p>`;
  await send(
    order.email,
    `${title} – ${order.orderNumber}${order.testMode ? ' [TEST]' : ''}`,
    layout(title, body, order.testMode, cfg),
    process.env.ORDER_NOTIFY_EMAIL || undefined
  );
}
