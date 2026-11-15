// DHL-Anbindung (NUR auf dem Server verwenden).
//
// 1) DHL Express – MyDHL API (offizielle REST-Schnittstelle von DHL Express)
//    Erstellt Sendungen, Etiketten (PDF) und Sendungsnummern.
//    Voraussetzung: DHL-Express-Kundenkonto (Kontonummer) + freigeschaltete API-Zugangsdaten
//    aus dem DHL Developer Portal (developer.dhl.com). Testumgebung vorhanden.
//
// 2) DHL Shipment Tracking – Unified API (offiziell, kostenlos mit API-Key)
//    Fragt den Sendungsstatus ab.
//
// Zugangsdaten nur über Umgebungsvariablen – nie im Code oder Repository.

import { shop } from '../shop';

export type DhlMode = 'test' | 'live';

export function dhlExpressConfig():
  | { ok: true; user: string; password: string; account: string; mode: DhlMode; baseUrl: string }
  | { ok: false; reason: string } {
  const user = process.env.DHL_EXPRESS_API_USER?.trim() ?? '';
  const password = process.env.DHL_EXPRESS_API_PASSWORD?.trim() ?? '';
  const account = process.env.DHL_EXPRESS_ACCOUNT_NUMBER?.trim() ?? '';
  const live = process.env.DHL_EXPRESS_MODE === 'live';
  if (!user || !password || !account) return { ok: false, reason: 'DHL-Express-Zugangsdaten fehlen' };
  if (live && process.env.DHL_ALLOW_LIVE !== 'true') {
    return { ok: false, reason: 'Live-Modus ist nicht freigegeben (DHL_ALLOW_LIVE=true fehlt)' };
  }
  return {
    ok: true,
    user,
    password,
    account,
    mode: live ? 'live' : 'test',
    baseUrl: live ? 'https://express.api.dhl.com/mydhlapi' : 'https://express.api.dhl.com/mydhlapi/test',
  };
}

export function senderProblems(): string[] {
  const c = shop.company;
  const problems: string[] = [];
  if (!c.name || c.name.startsWith('[')) problems.push('Firmenname');
  if (!c.street) problems.push('Straße');
  if (!c.postalCode) problems.push('PLZ');
  if (!c.city) problems.push('Ort');
  if (!c.phone) problems.push('Telefon');
  if (!c.email || c.email.startsWith('[')) problems.push('E-Mail');
  return problems;
}

export interface Recipient {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface LabelResult {
  trackingNumber: string;
  labelPdfBase64: string;
  mode: DhlMode;
}

// Versanddatum im Format, das die MyDHL API erwartet: "YYYY-MM-DDTHH:MM:SSGMT+01:00"
function plannedShippingDate(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Vienna',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'longOffset',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const offset = get('timeZoneName').replace('GMT', '') || '+00:00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}GMT${offset}`;
}

export async function createDhlExpressLabel(input: {
  reference: string;
  recipient: Recipient;
  productCode: string;
  weightKg: number;
}): Promise<{ ok: true; result: LabelResult } | { ok: false; error: string }> {
  const cfg = dhlExpressConfig();
  if (!cfg.ok) return { ok: false, error: cfg.reason };
  const missing = senderProblems();
  if (missing.length) return { ok: false, error: `Absenderangaben fehlen in src/lib/shop.ts: ${missing.join(', ')}` };

  const c = shop.company;
  const p = shop.parcel;
  const r = input.recipient;
  const body = {
    plannedShippingDateAndTime: plannedShippingDate(),
    pickup: { isRequested: false },
    productCode: input.productCode,
    accounts: [{ typeCode: 'shipper', number: cfg.account }],
    customerReferences: [{ value: input.reference.slice(0, 35), typeCode: 'CU' }],
    outputImageProperties: {
      encodingFormat: 'pdf',
      imageOptions: [{ typeCode: 'label', isRequested: true }],
    },
    customerDetails: {
      shipperDetails: {
        postalAddress: {
          postalCode: c.postalCode,
          cityName: c.city,
          countryCode: c.country,
          addressLine1: c.street.slice(0, 45),
        },
        contactInformation: {
          email: c.email,
          phone: c.phone,
          companyName: c.name.slice(0, 60),
          fullName: c.name.slice(0, 60),
        },
      },
      receiverDetails: {
        postalAddress: {
          postalCode: r.postalCode,
          cityName: r.city.slice(0, 45),
          countryCode: r.country,
          addressLine1: r.line1.slice(0, 45),
          ...(r.line2 ? { addressLine2: r.line2.slice(0, 45) } : {}),
        },
        contactInformation: {
          email: r.email,
          phone: r.phone || c.phone, // DHL verlangt eine Telefonnummer
          companyName: r.name.slice(0, 60),
          fullName: r.name.slice(0, 60),
        },
      },
    },
    content: {
      packages: [
        {
          weight: Math.max(0.1, Math.round(input.weightKg * 100) / 100),
          dimensions: { length: p.lengthCm, width: p.widthCm, height: p.heightCm },
          customerReferences: [{ value: input.reference.slice(0, 35), typeCode: 'CU' }],
        },
      ],
      isCustomsDeclarable: false,
      description: p.contentDescription,
      incoterm: 'DAP',
      unitOfMeasurement: 'metric',
    },
  };

  const res = await fetch(`${cfg.baseUrl}/shipments`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${cfg.user}:${cfg.password}`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as {
    shipmentTrackingNumber?: string;
    documents?: { typeCode?: string; imageFormat?: string; content?: string }[];
    detail?: string;
    title?: string;
    additionalDetails?: string[];
  };
  if (!res.ok || !data.shipmentTrackingNumber) {
    const detail = [data.title, data.detail, ...(data.additionalDetails ?? [])].filter(Boolean).join(' – ');
    return { ok: false, error: `DHL-Fehler (${res.status}): ${detail || 'unbekannt'}` };
  }
  const label = data.documents?.find((d) => d.typeCode === 'label') ?? data.documents?.[0];
  return {
    ok: true,
    result: { trackingNumber: data.shipmentTrackingNumber, labelPdfBase64: label?.content ?? '', mode: cfg.mode },
  };
}

// ---------- Sendungsverfolgung ----------

// Öffentliche DHL-Sendungsverfolgung für Kundinnen (funktioniert ohne API-Schlüssel)
export function dhlTrackingUrl(trackingNumber: string, locale: string): string {
  const lang = locale === 'en' ? 'at-en' : 'at-de';
  return `https://www.dhl.com/${lang}/home/tracking.html?tracking-id=${encodeURIComponent(trackingNumber)}&submit=1`;
}

export type TrackingState = 'pre-transit' | 'transit' | 'delivered' | 'failure' | 'unknown';

export async function fetchDhlTracking(
  trackingNumber: string
): Promise<{ ok: true; state: TrackingState; description: string; timestamp: string } | { ok: false; error: string }> {
  const key = process.env.DHL_TRACKING_API_KEY?.trim();
  if (!key) return { ok: false, error: 'DHL_TRACKING_API_KEY fehlt' };
  const res = await fetch(
    `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`,
    { headers: { 'DHL-API-Key': key, Accept: 'application/json' }, cache: 'no-store' }
  );
  if (res.status === 404) return { ok: true, state: 'unknown', description: 'Noch keine Daten bei DHL', timestamp: '' };
  if (!res.ok) return { ok: false, error: `Tracking-Fehler ${res.status}` };
  const data = (await res.json()) as {
    shipments?: { status?: { statusCode?: string; status?: string; description?: string; timestamp?: string } }[];
  };
  const st = data.shipments?.[0]?.status;
  const code = (st?.statusCode ?? 'unknown') as TrackingState;
  const known: TrackingState[] = ['pre-transit', 'transit', 'delivered', 'failure', 'unknown'];
  return {
    ok: true,
    state: known.includes(code) ? code : 'unknown',
    description: st?.description ?? st?.status ?? '',
    timestamp: st?.timestamp ?? '',
  };
}
