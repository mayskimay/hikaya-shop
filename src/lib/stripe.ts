// Server-Hilfen für Stripe. NUR auf dem Server verwenden (API-Routen, Server-Seiten).
// Geheime Schlüssel kommen ausschließlich aus Umgebungsvariablen – nie in den
// Frontend-Code oder ins Repository schreiben.

import { createHmac, timingSafeEqual } from 'node:crypto';

export type StripeMode = 'test' | 'live';

interface StripeConfig {
  key: string;
  mode: StripeMode;
}

// Liefert den Schlüssel nur, wenn er zum gewünschten Modus passt.
// Live-Schlüssel werden nur akzeptiert, wenn STRIPE_ALLOW_LIVE="true" gesetzt ist –
// so kann der Shop nicht versehentlich echte Zahlungen auslösen.
export function getStripeConfig():
  | { ok: true; config: StripeConfig }
  | { ok: false; reason: 'missing' | 'live_not_allowed' | 'invalid' } {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? '';
  if (!key) return { ok: false, reason: 'missing' };
  if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) {
    return { ok: true, config: { key, mode: 'test' } };
  }
  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) {
    if (process.env.STRIPE_ALLOW_LIVE !== 'true') return { ok: false, reason: 'live_not_allowed' };
    return { ok: true, config: { key, mode: 'live' } };
  }
  return { ok: false, reason: 'invalid' };
}

export function stripeMode(): StripeMode | null {
  const c = getStripeConfig();
  return c.ok ? c.config.mode : null;
}

// Einfache Stripe-API-Anfrage ohne zusätzliche Bibliothek
export async function stripeRequest<T = Record<string, unknown>>(
  method: 'GET' | 'POST',
  path: string,
  params?: URLSearchParams,
  idempotencyKey?: string
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const c = getStripeConfig();
  if (!c.ok) return { ok: false, status: 503, message: c.reason };
  const url =
    method === 'GET' && params ? `https://api.stripe.com/v1${path}?${params}` : `https://api.stripe.com/v1${path}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${c.config.key}` };
  if (method === 'POST') headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch(url, {
    method,
    headers,
    body: method === 'POST' ? params : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, message: data?.error?.message ?? `HTTP ${res.status}` };
  }
  return { ok: true, data: data as T };
}

// Prüft die Signatur eines Stripe-Webhooks (Header "Stripe-Signature").
// Verfahren laut Stripe: HMAC-SHA256 über "<timestamp>.<roher Body>" mit dem Webhook-Secret.
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
  now = Math.floor(Date.now() / 1000)
): boolean {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim());
  const timestamp = Number(parts.find((p) => p.startsWith('t='))?.slice(2));
  const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(now - timestamp) > toleranceSeconds) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  return signatures.some((sig) => {
    const buf = Buffer.from(sig, 'hex');
    return buf.length === expectedBuf.length && timingSafeEqual(buf, expectedBuf);
  });
}

// --- Typen der Stripe-Objekte, die wir verwenden (nur benötigte Felder) ---

export interface StripeAddress {
  line1?: string | null;
  line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface CheckoutSession {
  id: string;
  object: 'checkout.session';
  livemode: boolean;
  status: 'open' | 'complete' | 'expired';
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  amount_subtotal: number | null;
  amount_total: number | null;
  currency: string | null;
  created: number;
  locale?: string | null;
  metadata: Record<string, string> | null;
  payment_intent: string | { id: string } | null;
  customer_details?: {
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    address?: StripeAddress | null;
  } | null;
  // ältere API-Versionen
  shipping_details?: { name?: string | null; address?: StripeAddress | null } | null;
  // neuere API-Versionen (ab 2025-03-31)
  collected_information?: {
    shipping_details?: { name?: string | null; address?: StripeAddress | null } | null;
  } | null;
  total_details?: { amount_shipping?: number | null; amount_tax?: number | null } | null;
}

export interface StripeLineItem {
  description: string | null;
  quantity: number | null;
  amount_total: number;
  price?: { unit_amount: number | null } | null;
}

export function sessionShipping(s: CheckoutSession) {
  return s.collected_information?.shipping_details ?? s.shipping_details ?? null;
}
