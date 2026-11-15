// Zentrale Statusprüfung aller Anbieter. NUR auf dem Server verwenden.
// Grundsatz: „aktiv“ heißt, die Verbindung ist mit echten Zugangsdaten eingerichtet UND geprüft.
// Kundinnen sehen eine Zahlungs- oder Versandart nur, wenn sie wirklich funktioniert.
// Es werden nie Zugangsdaten ausgegeben – nur ja/nein, Modus und was noch fehlt.

import { getStripeConfig, stripeRequest } from './stripe';
import { dhlExpressConfig, senderProblems } from './shipping/dhl';
import { canStoreOrders } from './orders';
import { emailConfigured } from './email';
import { adminSetup } from './adminAuth';
import type { ShopConfig } from './settings';

export type ProviderState = 'live' | 'test' | 'not_connected' | 'needs_setup';

export const STATE_LABEL: Record<ProviderState, string> = {
  live: 'aktiv',
  test: 'im Testmodus',
  not_connected: 'noch nicht verbunden',
  needs_setup: 'wartet auf deine Einrichtung',
};

export interface Link {
  label: string;
  url: string;
}

export interface ProviderStatus {
  id: string;
  name: string;
  area: 'Zahlung' | 'Versand' | 'Sendungsverfolgung' | 'E-Mail' | 'Datenbank' | 'Verwaltung';
  state: ProviderState;
  detail: string;
  steps: string[]; // was die Inhaberin noch tun muss (leer = nichts)
  links: Link[]; // offizielle Einrichtungsseiten
}

// Schlüssel nie anzeigen, auch nicht teilweise in Fehlermeldungen
export const redact = (s: string) => s.replace(/\b(sk|rk|pk|whsec)_[A-Za-z0-9_*]+/g, '[Schlüssel]');

const VERCEL_ENV: Link = { label: 'Vercel: Umgebungsvariablen', url: 'https://vercel.com/dashboard' };

// ---------- Stripe-Konto prüfen ----------

export interface StripeAccountCheck {
  reachable: boolean;
  error?: string;
  displayName?: string;
  country?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean; // Bankkonto für Auszahlungen hinterlegt und bestätigt
  detailsSubmitted?: boolean;
  currentlyDue?: number; // Anzahl offener Angaben, die Stripe verlangt
  disabledReason?: string;
}

export async function checkStripeAccount(): Promise<StripeAccountCheck | null> {
  const cfg = getStripeConfig();
  if (!cfg.ok) return null;
  const r = await stripeRequest<{
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
    country?: string;
    business_profile?: { name?: string };
    settings?: { dashboard?: { display_name?: string } };
    requirements?: { currently_due?: string[]; disabled_reason?: string | null };
  }>('GET', '/account').catch((e: Error) => ({ ok: false as const, status: 0, message: e.message }));
  if (!r.ok) return { reachable: false, error: redact(r.message) };
  const a = r.data;
  return {
    reachable: true,
    displayName: a.settings?.dashboard?.display_name || a.business_profile?.name || '',
    country: a.country,
    chargesEnabled: a.charges_enabled === true,
    payoutsEnabled: a.payouts_enabled === true,
    detailsSubmitted: a.details_submitted === true,
    currentlyDue: a.requirements?.currently_due?.length ?? 0,
    disabledReason: a.requirements?.disabled_reason ?? undefined,
  };
}

// ---------- Zahlungsarten im Stripe-Konto ----------

export const METHOD_NAMES: Record<string, { de: string; en: string }> = {
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

export type MethodState = 'on' | 'pending' | 'off';

export interface MethodOverview {
  id: string;
  name: { de: string; en: string };
  state: MethodState; // on = eingeschaltet und verfügbar, pending = eingeschaltet, aber noch nicht freigeschaltet
}

export interface PaymentMethodsResult {
  state: 'not_connected' | 'test' | 'live';
  reachable: boolean;
  all: MethodOverview[];
  methods: { id: string; name: { de: string; en: string } }[]; // nur die wirklich aktiven
}

export function classifyMethods(conf: Record<string, unknown> | undefined): MethodOverview[] {
  return Object.keys(METHOD_NAMES).map((id) => {
    const m = conf?.[id] as { available?: boolean; display_preference?: { value?: string } } | undefined;
    const on = m?.display_preference?.value === 'on';
    const state: MethodState = on && m?.available === true ? 'on' : on ? 'pending' : 'off';
    return { id, name: METHOD_NAMES[id], state };
  });
}

// Liest die Standard-Konfiguration der Zahlungsarten aus dem Stripe-Konto.
export async function activePaymentMethods(): Promise<PaymentMethodsResult> {
  const cfg = getStripeConfig();
  if (!cfg.ok) return { state: 'not_connected', reachable: false, all: classifyMethods(undefined), methods: [] };
  const r = await stripeRequest<{ data: Record<string, unknown>[] }>(
    'GET',
    '/payment_method_configurations',
    new URLSearchParams({ is_default: 'true', limit: '1' })
  ).catch((e: Error) => ({ ok: false as const, status: 0, message: e.message }));
  const all = classifyMethods(r.ok ? r.data.data?.[0] : undefined);
  return {
    state: cfg.config.mode,
    reachable: r.ok,
    all,
    methods: all.filter((m) => m.state === 'on').map(({ id, name }) => ({ id, name })),
  };
}

// ---------- Status je Anbieter ----------

const stripeDash = (mode: 'test' | 'live' | null, path: string) =>
  `https://dashboard.stripe.com/${mode === 'live' ? '' : 'test/'}${path}`;

export function stripeProvider(account: StripeAccountCheck | null): ProviderStatus {
  const cfg = getStripeConfig();
  const webhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const base = { id: 'stripe', name: 'Stripe – Karten, Apple/Google Pay, eps, SEPA, Klarna, PayPal', area: 'Zahlung' as const };
  const steps: string[] = [];
  const mode = cfg.ok ? cfg.config.mode : null;
  const links: Link[] = [
    { label: 'Stripe-Konto anlegen', url: 'https://dashboard.stripe.com/register' },
    { label: 'API-Schlüssel', url: stripeDash(mode, 'apikeys') },
    { label: 'Webhooks', url: stripeDash(mode, 'webhooks') },
    { label: 'Zahlungsarten', url: 'https://dashboard.stripe.com/settings/payment_methods' },
    { label: 'Konto aktivieren', url: 'https://dashboard.stripe.com/account/onboarding' },
    { label: 'Bankkonto / Auszahlungen', url: 'https://dashboard.stripe.com/settings/payouts' },
    VERCEL_ENV,
  ];

  if (!cfg.ok && cfg.reason !== 'live_not_allowed') {
    return {
      ...base,
      state: 'not_connected',
      detail: 'Kein Stripe-Schlüssel eingetragen – die Kasse ist gesperrt.',
      steps: [
        'Stripe-Konto anlegen (am besten durch die Inhaberin selbst).',
        'Im Testmodus den geheimen Schlüssel (beginnt mit sk_test_) kopieren und bei Vercel als STRIPE_SECRET_KEY eintragen.',
        'Webhook anlegen (Adresse: https://DEINE-DOMAIN/api/stripe/webhook) und das Signing secret (whsec_…) als STRIPE_WEBHOOK_SECRET eintragen.',
        'Neu deployen und mit einer Testkarte bestellen.',
      ],
      links,
    };
  }
  if (!cfg.ok) {
    return {
      ...base,
      state: 'needs_setup',
      detail: 'Ein Live-Schlüssel ist eingetragen, aber noch nicht freigegeben – es werden keine echten Zahlungen angenommen.',
      steps: ['Erst nach erfolgreichem Test: bei Vercel STRIPE_ALLOW_LIVE=true setzen und neu deployen.'],
      links,
    };
  }
  if (!account?.reachable) {
    return {
      ...base,
      state: 'needs_setup',
      detail: `Verbindung zu Stripe fehlgeschlagen – Schlüssel prüfen.${account?.error ? ` (${redact(account.error).slice(0, 120)})` : ''}`,
      steps: ['Den Schlüssel bei Vercel prüfen (vollständig kopiert? richtiger Modus?) und neu deployen.'],
      links,
    };
  }
  if (!webhook) steps.push('Webhook anlegen und STRIPE_WEBHOOK_SECRET eintragen – ohne ihn werden Zahlungen nicht bestätigt und Bestellungen nicht gespeichert.');

  if (mode === 'test') {
    if (!account.chargesEnabled || !account.detailsSubmitted) {
      steps.push('Für echte Zahlungen: Konto bei Stripe aktivieren (Geschäftsangaben, Ausweis, Bankkonto).');
    } else {
      steps.push('Konto ist aktiviert. Für echte Zahlungen: Live-Schlüssel und neuen Live-Webhook eintragen, dann STRIPE_ALLOW_LIVE=true.');
    }
    return {
      ...base,
      state: 'test',
      detail: `Verbunden im Testmodus${account.displayName ? ` (${account.displayName})` : ''} – es werden keine echten Zahlungen ausgeführt.`,
      steps,
      links,
    };
  }

  // Live-Modus
  if (!account.chargesEnabled) steps.push(`Stripe nimmt noch keine Zahlungen an: Kontoaktivierung abschließen${account.currentlyDue ? ` (${account.currentlyDue} offene Angaben)` : ''}.`);
  if (!account.payoutsEnabled) steps.push('Bankkonto für Auszahlungen bei Stripe hinterlegen bzw. bestätigen lassen.');
  return {
    ...base,
    state: steps.length ? 'needs_setup' : 'live',
    detail: steps.length
      ? 'Live-Schlüssel eingetragen, aber die Einrichtung ist noch nicht abgeschlossen.'
      : `Live verbunden und geprüft${account.displayName ? ` (${account.displayName})` : ''}: echte Zahlungen, Auszahlungen aktiv.`,
    steps,
    links,
  };
}

export function paypalProvider(pm: PaymentMethodsResult): ProviderStatus {
  const paypal = pm.all.find((m) => m.id === 'paypal');
  const links: Link[] = [
    { label: 'Stripe: Zahlungsarten (PayPal)', url: 'https://dashboard.stripe.com/settings/payment_methods' },
    { label: 'PayPal-Geschäftskonto', url: 'https://www.paypal.com/at/business' },
  ];
  const base = { id: 'paypal', name: 'PayPal (über Stripe)', area: 'Zahlung' as const, links };
  if (pm.state === 'not_connected') {
    return { ...base, state: 'not_connected', detail: 'Wird über Stripe angeboten – zuerst Stripe verbinden.', steps: ['Stripe einrichten (siehe oben).', 'Danach in Stripe unter Zahlungsarten PayPal einschalten bzw. Zugang beantragen und ein PayPal-Geschäftskonto verknüpfen.'] };
  }
  if (paypal?.state === 'on') {
    return { ...base, state: pm.state, detail: pm.state === 'test' ? 'In Stripe eingeschaltet (Testmodus).' : 'In Stripe eingeschaltet und freigeschaltet.', steps: [] };
  }
  if (paypal?.state === 'pending') {
    return { ...base, state: 'needs_setup', detail: 'In Stripe eingeschaltet, aber noch nicht freigeschaltet.', steps: ['Freischaltung in Stripe abwarten bzw. die Anweisungen dort befolgen (PayPal-Konto verknüpfen). Die Prüfung kann einige Wochen dauern.'] };
  }
  return {
    ...base,
    state: 'not_connected',
    detail: pm.reachable ? 'In Stripe nicht eingeschaltet.' : 'Status konnte nicht von Stripe gelesen werden.',
    steps: ['In Stripe unter Einstellungen → Zahlungsarten bei PayPal „Einschalten“ bzw. „Zugang anfordern“ wählen.', 'PayPal-Geschäftskonto verknüpfen, sobald Stripe die Freischaltung bestätigt.'],
  };
}

export function dhlLive(cfg: ShopConfig): boolean {
  const dhl = dhlExpressConfig();
  return dhl.ok && dhl.mode === 'live' && senderProblems(cfg.company).length === 0;
}

export function shippingProviders(cfg: ShopConfig): ProviderStatus[] {
  const dhl = dhlExpressConfig();
  const sender = senderProblems(cfg.company);
  const usesDhl = cfg.zones.some((z) => z.carrier === 'dhl-express');
  const dhlLinks: Link[] = [
    { label: 'DHL Express Geschäftskunde werden', url: 'https://www.dhl.com/at-de/home/ein-geschaeftskonto-beantragen.html' },
    { label: 'DHL Developer Portal (MyDHL API)', url: 'https://developer.dhl.com/api-reference/dhl-express-mydhl-api' },
    VERCEL_ENV,
  ];
  let express: ProviderStatus;
  if (!dhl.ok && dhl.reason === 'DHL-Express-Zugangsdaten fehlen') {
    express = {
      id: 'dhl-express',
      name: 'DHL Express – Versandetiketten',
      area: 'Versand',
      state: 'not_connected',
      detail: 'Keine Zugangsdaten. Etiketten im DHL-Portal erstellen und die Sendungsnummer bei der Bestellung von Hand eintragen.',
      steps: [
        'DHL-Express-Geschäftskonto (Kontonummer) eröffnen.',
        'Im DHL Developer Portal Zugang zur MyDHL API beantragen.',
        'Bei Vercel DHL_EXPRESS_API_USER, DHL_EXPRESS_API_PASSWORD und DHL_EXPRESS_ACCOUNT_NUMBER eintragen (DHL_EXPRESS_MODE=test).',
      ],
      links: dhlLinks,
    };
  } else if (!dhl.ok) {
    express = { id: 'dhl-express', name: 'DHL Express – Versandetiketten', area: 'Versand', state: 'needs_setup', detail: dhl.reason, steps: ['Erst nach erfolgreichem Test DHL_ALLOW_LIVE=true setzen.'], links: dhlLinks };
  } else if (sender.length) {
    express = { id: 'dhl-express', name: 'DHL Express – Versandetiketten', area: 'Versand', state: 'needs_setup', detail: `Absenderangaben fehlen: ${sender.join(', ')}`, steps: ['Unter Shop-Infos die fehlenden Angaben eintragen.'], links: dhlLinks };
  } else {
    express = {
      id: 'dhl-express',
      name: 'DHL Express – Versandetiketten',
      area: 'Versand',
      state: dhl.mode,
      detail:
        dhl.mode === 'test'
          ? 'Testumgebung: Etiketten sind nicht gültig, es wird nichts an DHL übergeben. „Verbindung prüfen“ testet die Zugangsdaten.'
          : 'Live: echte Sendungen. „Verbindung prüfen“ testet die Zugangsdaten.',
      steps: dhl.mode === 'test' ? ['Nach erfolgreichem Test: DHL_EXPRESS_MODE=live und DHL_ALLOW_LIVE=true setzen.'] : [],
      links: dhlLinks,
    };
  }
  if (usesDhl && express.state !== 'live') {
    express.detail = express.detail.replace(/\.?$/, '.') + ' Zonen mit „DHL Express“ werden Kundinnen bis dahin als „Standardversand“ angezeigt.';
  }

  const trackingKey = Boolean(process.env.DHL_TRACKING_API_KEY?.trim());
  const cron = Boolean(process.env.CRON_SECRET?.trim());
  const tracking: ProviderStatus = {
    id: 'dhl-tracking',
    name: 'DHL Sendungsverfolgung (Status abfragen)',
    area: 'Sendungsverfolgung',
    state: trackingKey ? (cron ? 'live' : 'needs_setup') : 'not_connected',
    detail: trackingKey ? (cron ? 'Schlüssel eingetragen, tägliche Abfrage eingerichtet.' : 'Schlüssel eingetragen, CRON_SECRET fehlt (keine tägliche Abfrage).') : 'Kein Schlüssel – der Link zur DHL-Sendungsverfolgung in der Versand-E-Mail funktioniert trotzdem.',
    steps: trackingKey ? (cron ? [] : ['CRON_SECRET (zufälliger Text) bei Vercel eintragen.']) : ['Auf developer.dhl.com eine App mit „Shipment Tracking – Unified“ anlegen und den Schlüssel als DHL_TRACKING_API_KEY eintragen.'],
    links: [{ label: 'DHL Shipment Tracking API', url: 'https://developer.dhl.com/api-reference/shipment-tracking' }, VERCEL_ENV],
  };

  const others: ProviderStatus[] = [
    ['post', 'Österreichische Post', 'https://www.post.at'],
    ['dpd', 'DPD', 'https://www.dpd.com/at/de/'],
    ['gls', 'GLS', 'https://gls-group.com/AT/de/'],
    ['hermes', 'Hermes', 'https://www.hermesworld.com/us/about-us/hermes-group/hermes-austria/'],
    ['ups', 'UPS', 'https://www.ups.com/at/de/'],
  ].map(([id, name, url]) => ({
    id,
    name,
    area: 'Versand' as const,
    state: 'not_connected' as const,
    detail: 'Im Shop nicht angebunden. Pakete können trotzdem manuell verschickt und die Sendungsnummer eingetragen werden.',
    steps: [`Geschäftskundenvertrag mit ${name} abschließen.`, 'Für mehrere Dienste gemeinsam eine Versandplattform wählen (z. B. Sendcloud) – dann kann die Anbindung eingebaut werden.'],
    links: [{ label: `${name} für Geschäftskunden`, url }],
  }));

  return [express, tracking, ...others];
}

export function infrastructureProviders(): ProviderStatus[] {
  const admin = adminSetup();
  return [
    {
      id: 'resend',
      name: 'Resend – Bestell- und Versand-E-Mails',
      area: 'E-Mail',
      state: emailConfigured() ? (process.env.ORDER_NOTIFY_EMAIL?.trim() ? 'live' : 'needs_setup') : 'not_connected',
      detail: emailConfigured()
        ? process.env.ORDER_NOTIFY_EMAIL?.trim()
          ? 'Eingetragen (geprüft wird beim ersten Versand).'
          : 'Eingetragen, aber ORDER_NOTIFY_EMAIL fehlt – du bekommst keine Info über neue Bestellungen.'
        : 'Nicht eingerichtet – es werden keine E-Mails verschickt.',
      steps: emailConfigured() ? (process.env.ORDER_NOTIFY_EMAIL?.trim() ? [] : ['ORDER_NOTIFY_EMAIL eintragen.']) : ['Resend-Konto anlegen, eigene Domain bestätigen.', 'RESEND_API_KEY, ORDER_EMAIL_FROM und ORDER_NOTIFY_EMAIL bei Vercel eintragen.'],
      links: [{ label: 'Resend', url: 'https://resend.com/domains' }, VERCEL_ENV],
    },
    {
      id: 'sanity',
      name: 'Sanity – Produkte, Einstellungen, Bestellungen',
      area: 'Datenbank',
      state: canStoreOrders() ? 'live' : 'not_connected',
      detail: canStoreOrders() ? 'Verbunden mit Schreibrecht.' : 'Ohne Sanity werden Beispielprodukte gezeigt, Bestellungen nicht gespeichert und Änderungen hier nicht gespeichert.',
      steps: canStoreOrders() ? [] : ['Sanity-Projekt anlegen, NEXT_PUBLIC_SANITY_PROJECT_ID eintragen.', 'API-Token mit Rolle „Editor“ erstellen und als SANITY_API_WRITE_TOKEN eintragen.'],
      links: [{ label: 'Sanity-Verwaltung', url: 'https://www.sanity.io/manage' }, VERCEL_ENV],
    },
    {
      id: 'admin',
      name: 'Anmeldung für diesen Bereich',
      area: 'Verwaltung',
      state: admin.ok ? 'live' : 'needs_setup',
      detail: admin.ok ? 'Geschützt (eigenes Passwort, Sitzung 8 Stunden).' : admin.problems.join('; '),
      steps: admin.ok ? [] : admin.problems,
      links: [VERCEL_ENV],
    },
  ];
}
