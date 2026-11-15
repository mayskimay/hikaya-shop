// Zentrale Statusprüfung aller angebundenen Anbieter. NUR auf dem Server verwenden.
// Grundsatz: Eine Zahlungs- oder Versandart wird Kundinnen nur angezeigt, wenn sie
// wirklich eingerichtet ist. Es werden keine Zugangsdaten ausgegeben – nur ja/nein/Modus.

import { getStripeConfig, stripeRequest } from './stripe';
import { dhlExpressConfig, senderProblems } from './shipping/dhl';
import { canStoreOrders } from './orders';
import { emailConfigured } from './email';
import { adminConfigured } from './adminAuth';

export type ProviderState = 'missing' | 'test' | 'live' | 'blocked';

export interface ProviderStatus {
  id: string;
  name: string;
  area: 'Zahlung' | 'Versand' | 'Sendungsverfolgung' | 'E-Mail' | 'Bestellungen' | 'Verwaltung';
  state: ProviderState;
  detail: string;
}

export function providerStatus(): ProviderStatus[] {
  const stripe = getStripeConfig();
  const dhl = dhlExpressConfig();
  const sender = senderProblems();
  return [
    {
      id: 'stripe',
      name: 'Stripe (Kasse & Zahlungsarten)',
      area: 'Zahlung',
      state: stripe.ok ? stripe.config.mode : stripe.reason === 'live_not_allowed' ? 'blocked' : 'missing',
      detail: stripe.ok
        ? stripe.config.mode === 'test'
          ? 'Testmodus – keine echten Zahlungen'
          : 'Live – echte Zahlungen'
        : stripe.reason === 'live_not_allowed'
          ? 'Live-Schlüssel eingetragen, aber nicht freigegeben (STRIPE_ALLOW_LIVE)'
          : 'STRIPE_SECRET_KEY fehlt',
    },
    {
      id: 'stripe-webhook',
      name: 'Stripe-Webhook (Zahlungsbestätigung)',
      area: 'Zahlung',
      state: process.env.STRIPE_WEBHOOK_SECRET?.trim() ? (stripe.ok ? stripe.config.mode : 'missing') : 'missing',
      detail: process.env.STRIPE_WEBHOOK_SECRET?.trim() ? 'Signing secret eingetragen' : 'STRIPE_WEBHOOK_SECRET fehlt',
    },
    {
      id: 'dhl-express',
      name: 'DHL Express (Etiketten)',
      area: 'Versand',
      state: dhl.ok ? (sender.length ? 'blocked' : dhl.mode) : 'missing',
      detail: dhl.ok
        ? sender.length
          ? `Absenderangaben fehlen: ${sender.join(', ')}`
          : dhl.mode === 'test'
            ? 'Testumgebung – Etiketten nicht gültig'
            : 'Live – echte Sendungen'
        : dhl.reason,
    },
    {
      id: 'dhl-tracking',
      name: 'DHL Sendungsverfolgung',
      area: 'Sendungsverfolgung',
      state: process.env.DHL_TRACKING_API_KEY?.trim() ? 'live' : 'missing',
      detail: process.env.DHL_TRACKING_API_KEY?.trim()
        ? process.env.CRON_SECRET?.trim()
          ? 'Schlüssel und tägliche Abfrage eingerichtet'
          : 'Schlüssel da, CRON_SECRET fehlt (keine tägliche Abfrage)'
        : 'DHL_TRACKING_API_KEY fehlt',
    },
    {
      id: 'resend',
      name: 'Resend (Bestell- und Versand-E-Mails)',
      area: 'E-Mail',
      state: emailConfigured() ? 'live' : 'missing',
      detail: emailConfigured()
        ? process.env.ORDER_NOTIFY_EMAIL?.trim()
          ? 'eingerichtet'
          : 'eingerichtet, ORDER_NOTIFY_EMAIL fehlt (keine Info an die Inhaberin)'
        : 'RESEND_API_KEY / ORDER_EMAIL_FROM fehlen',
    },
    {
      id: 'sanity-orders',
      name: 'Sanity (Bestellungen speichern, Bestand)',
      area: 'Bestellungen',
      state: canStoreOrders() ? 'live' : 'missing',
      detail: canStoreOrders() ? 'Schreib-Token eingetragen' : 'Project ID oder SANITY_API_WRITE_TOKEN fehlt',
    },
    {
      id: 'admin',
      name: 'Versand-Seite (Passwortschutz)',
      area: 'Verwaltung',
      state: adminConfigured() ? 'live' : 'missing',
      detail: adminConfigured() ? 'geschützt' : 'ADMIN_USER / ADMIN_PASSWORD fehlen',
    },
  ];
}

// DHL Express wird Kundinnen erst als Versanddienst genannt, wenn er LIVE verbunden ist.
export function dhlLiveForCustomers(): boolean {
  const dhl = dhlExpressConfig();
  return dhl.ok && dhl.mode === 'live' && senderProblems().length === 0;
}

// ---------- Zahlungsarten, die in Stripe wirklich aktiviert sind ----------

const METHOD_NAMES: Record<string, { de: string; en: string }> = {
  card: { de: 'Kredit- und Debitkarte', en: 'Credit and debit card' },
  apple_pay: { de: 'Apple Pay', en: 'Apple Pay' },
  google_pay: { de: 'Google Pay', en: 'Google Pay' },
  paypal: { de: 'PayPal', en: 'PayPal' },
  eps: { de: 'eps-Überweisung', en: 'EPS bank transfer' },
  sepa_debit: { de: 'SEPA-Lastschrift', en: 'SEPA Direct Debit' },
  klarna: { de: 'Klarna', en: 'Klarna' },
  link: { de: 'Link (Stripe)', en: 'Link (Stripe)' },
  revolut_pay: { de: 'Revolut Pay', en: 'Revolut Pay' },
  bancontact: { de: 'Bancontact', en: 'Bancontact' },
  ideal: { de: 'iDEAL', en: 'iDEAL' },
};

export interface PaymentMethodsResult {
  state: ProviderState;
  methods: { id: string; name: { de: string; en: string } }[];
}

// Liest die Standard-Konfiguration der Zahlungsarten aus dem Stripe-Konto.
// Angezeigt wird nur, was dort eingeschaltet UND für das Konto verfügbar ist.
export async function activePaymentMethods(): Promise<PaymentMethodsResult> {
  const cfg = getStripeConfig();
  if (!cfg.ok) return { state: 'missing', methods: [] };
  const r = await stripeRequest<{ data: Record<string, unknown>[] }>(
    'GET',
    '/payment_method_configurations',
    new URLSearchParams({ is_default: 'true', limit: '1' })
  );
  if (!r.ok || !r.data.data?.length) return { state: cfg.config.mode, methods: [] };
  const conf = r.data.data[0];
  const methods = Object.keys(METHOD_NAMES)
    .filter((id) => {
      const m = conf[id] as { available?: boolean; display_preference?: { value?: string } } | undefined;
      return m?.available === true && m.display_preference?.value === 'on';
    })
    .map((id) => ({ id, name: METHOD_NAMES[id] }));
  return { state: cfg.config.mode, methods };
}
