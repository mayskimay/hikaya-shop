// Prüft Eingaben aus den Formularen im Verwaltungsbereich, bevor sie gespeichert werden.
// Es wird nur gespeichert, wenn alles gültig ist – sonst kommen verständliche Fehlermeldungen zurück.

import { TEXT_FIELDS, safeUrl, validateZones } from './settings';

type Obj = Record<string, unknown>;
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const loc = (v: unknown, max: number) => ({ de: str(obj(v).de, max), en: str(obj(v).en, max) });

export interface InputResult {
  ok: boolean;
  errors: string[];
  doc?: Obj;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()/.-]{6,25}$/;

export function shopSettingsInput(raw: unknown): InputResult {
  const r = obj(raw);
  const c = obj(r.company);
  const k = obj(r.contact);
  const errors: string[] = [];
  const company = {
    name: str(c.name),
    street: str(c.street),
    postalCode: str(c.postalCode, 12),
    city: str(c.city),
    country: str(c.country, 20).toUpperCase() || 'AT',
    email: str(c.email),
    phone: str(c.phone, 25),
    trade: str(c.trade),
    authority: str(c.authority),
    uid: str(c.uid, 20),
    register: str(c.register),
  };
  if (company.email && !EMAIL.test(company.email)) errors.push('Unternehmen: E-Mail-Adresse ist ungültig');
  if (company.phone && !PHONE.test(company.phone)) errors.push('Unternehmen: Telefonnummer ist ungültig (z. B. +43 660 1234567)');
  if (!/^[A-Z]{2}$/.test(company.country)) errors.push('Unternehmen: Land als 2-stelligen Code angeben (z. B. AT)');
  if (company.postalCode && !/^[A-Za-z0-9 -]{3,10}$/.test(company.postalCode)) errors.push('Unternehmen: PLZ ist ungültig');

  const contact: Obj = { email: str(k.email) };
  if (contact.email && !EMAIL.test(String(contact.email))) errors.push('Kontakt: E-Mail-Adresse ist ungültig');
  for (const key of ['instagram', 'tiktok', 'whatsapp'] as const) {
    const v = str(k[key], 500);
    if (!v) continue;
    const url = safeUrl(v);
    if (!url) errors.push(`Kontakt: ${key}-Link muss mit https:// beginnen`);
    else contact[key] = url;
  }

  const doc = {
    _id: 'shopSettings',
    _type: 'shopSettings',
    company,
    contact,
    vatNote: loc(r.vatNote, 300),
    packagingNote: loc(r.packagingNote, 1000),
  };
  return { ok: errors.length === 0, errors, doc };
}

export function shippingSettingsInput(raw: unknown): InputResult {
  const r = obj(raw);
  const { zones, errors } = validateZones(r.zones);
  if (!zones.length) errors.push('Mindestens eine gültige Versandzone ist nötig.');
  const p = obj(r.parcel);
  const int = (v: unknown, name: string, min: number, max: number) => {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) {
      errors.push(`Paket: ${name} ist ungültig`);
      return undefined;
    }
    return Math.round(n);
  };
  const parcel = {
    packagingWeightG: int(p.packagingWeightG, 'Gewicht Verpackung', 0, 70000),
    defaultItemWeightG: int(p.defaultItemWeightG, 'Standardgewicht je Artikel', 1, 70000),
    lengthCm: int(p.lengthCm, 'Länge', 1, 300),
    widthCm: int(p.widthCm, 'Breite', 1, 300),
    heightCm: int(p.heightCm, 'Höhe', 1, 300),
  };
  const doc = {
    _id: 'shippingSettings',
    _type: 'shippingSettings',
    zones: zones.map((z) => ({
      _key: z.id,
      _type: 'zone',
      id: z.id,
      label: z.label,
      countries: z.countries,
      amount: z.amount,
      ...(z.freeFrom !== undefined ? { freeFrom: z.freeFrom } : {}),
      delivery: z.delivery,
      carrier: z.carrier,
      dhlProductCode: z.dhlProductCode ?? '',
    })),
    parcel: Object.fromEntries(Object.entries(parcel).filter(([, v]) => v !== undefined)),
  };
  return { ok: errors.length === 0, errors, doc };
}

export function siteTextsInput(raw: unknown): InputResult {
  const r = obj(raw);
  const doc: Obj = { _id: 'siteTexts', _type: 'siteTexts' };
  for (const f of TEXT_FIELDS) {
    const v = loc(r[f.key], f.long ? 20000 : 200);
    if (v.de || v.en) doc[f.key] = v;
  }
  return { ok: true, errors: [], doc };
}
