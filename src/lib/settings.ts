// Shop-Einstellungen, die die Inhaberin im Verwaltungsbereich ändert (gespeichert in Sanity).
// Ist dort noch nichts eingetragen oder Sanity nicht eingerichtet, gelten die Startwerte aus
// src/lib/shop.ts und src/lib/site.ts. Hier stehen nur öffentliche Angaben – keine Geheimnisse.

import { apiVersion, dataset, isSanityConfigured, projectId } from '@/sanity/env';
import { shop as defaults } from './shop';
import { site as siteDefaults } from './site';
import { getDict, type Dict } from './dict';
import type { Locale } from './i18n';

type L = Record<Locale, string>;
type RawL = { de?: string | null; en?: string | null } | null | undefined;

export type CarrierId = 'standard' | 'dhl-express';

export interface Zone {
  id: string;
  label: L;
  countries: string[];
  amount: number;
  freeFrom?: number;
  delivery: L;
  carrier: CarrierId;
  dhlProductCode?: string; // N / U – nur bei DHL Express, sonst kein automatisches Etikett
}

export interface Parcel {
  packagingWeightG: number;
  defaultItemWeightG: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  contentDescription: string;
}

export interface Company {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  trade: string;
  authority: string;
  uid: string;
  register: string;
  address: string; // zusammengesetzt für Anzeige
}

export interface Contact {
  email: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
}

export interface ShopConfig {
  zones: Zone[];
  parcel: Parcel;
  company: Company;
  contact: Contact;
  vatNote: L;
  packagingNote: L;
  texts: Partial<Record<TextKey, L>>;
  currency: string;
  maxQtyPerItem: number;
  fromCms: { shop: boolean; shipping: boolean; texts: boolean };
}

// ---------- Texte, die im Adminbereich geändert werden können ----------

export const TEXT_FIELDS = [
  { key: 'tagline', label: 'Slogan', path: ['tagline'], long: false, legal: false },
  { key: 'heroTitle', label: 'Startseite: Überschrift', path: ['home', 'heroTitle'], long: false, legal: false },
  { key: 'heroText', label: 'Startseite: Einleitung', path: ['home', 'heroText'], long: true, legal: false },
  { key: 'storyTitle', label: 'Startseite: Geschichte – Überschrift', path: ['home', 'storyTitle'], long: false, legal: false },
  { key: 'storyText', label: 'Startseite: Geschichte – Text', path: ['home', 'storyText'], long: true, legal: false },
  { key: 'contactText', label: 'Startseite: Kontakt – Text', path: ['home', 'contactText'], long: true, legal: false },
  { key: 'aboutBody', label: 'Seite „Über uns“', path: ['info', 'about', 'body'], long: true, legal: false },
  { key: 'shippingBody', label: 'Seite „Versand“ – Einleitung', path: ['info', 'shipping', 'body'], long: true, legal: false },
  { key: 'paymentBody', label: 'Seite „Zahlung“ – Einleitung', path: ['info', 'payment', 'body'], long: true, legal: false },
  { key: 'contactBody', label: 'Seite „Kontakt“', path: ['info', 'contact', 'body'], long: true, legal: false },
  { key: 'returnsBody', label: 'Rückgabe & Widerruf', path: ['info', 'returns', 'body'], long: true, legal: true },
  { key: 'termsBody', label: 'AGB', path: ['info', 'terms', 'body'], long: true, legal: true },
  { key: 'privacyBody', label: 'Datenschutz', path: ['info', 'privacy', 'body'], long: true, legal: true },
  { key: 'imprintBody', label: 'Impressum – Einleitung', path: ['info', 'imprint', 'body'], long: true, legal: true },
] as const;

export type TextKey = (typeof TEXT_FIELDS)[number]['key'];

// Text aus dem Wörterbuch an einem Pfad lesen/ersetzen
export function dictValue(dict: Dict, path: readonly string[]): string {
  let v: unknown = dict;
  for (const p of path) v = (v as Record<string, unknown>)?.[p];
  return typeof v === 'string' ? v : '';
}

export function applyTexts(dict: Dict, texts: ShopConfig['texts'], locale: Locale): Dict {
  const out = structuredClone(dict);
  for (const f of TEXT_FIELDS) {
    const value = texts[f.key]?.[locale]?.trim();
    if (!value) continue;
    let target = out as unknown as Record<string, unknown>;
    for (const p of f.path.slice(0, -1)) target = target[p] as Record<string, unknown>;
    target[f.path[f.path.length - 1]] = value;
  }
  return out;
}

// ---------- Zusammenführen & Prüfen ----------

const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const money = (v: unknown) => {
  const n = num(v);
  return n !== undefined && n >= 0 && n <= 10000 ? Math.round(n * 100) / 100 : undefined;
};

// Ist nur eine Sprache ausgefüllt, gilt sie für beide. Leer → Startwert.
function locOr(v: RawL, fallback: L, max = 2000): L {
  const de = str(v?.de, max);
  const en = str(v?.en, max);
  if (!de && !en) return fallback;
  return { de: de || en, en: en || de };
}

function optionalLoc(v: RawL, max = 20000): L | undefined {
  const de = str(v?.de, max);
  const en = str(v?.en, max);
  if (!de && !en) return undefined;
  return { de: de || en, en: en || de };
}

export interface ShippingValidation {
  zones: Zone[];
  errors: string[];
}

// Prüft Versandzonen (aus dem Formular oder aus Sanity). Ungültige Zonen werden verworfen.
export function validateZones(raw: unknown): ShippingValidation {
  const errors: string[] = [];
  const list = Array.isArray(raw) ? raw.slice(0, 30) : [];
  const seenIds = new Set<string>();
  const seenCountries = new Set<string>();
  const zones: Zone[] = [];
  list.forEach((z: Record<string, unknown>, i) => {
    const n = i + 1;
    const id = str(z?.id, 20).toLowerCase();
    const label = locOr(z?.label as RawL, { de: '', en: '' }, 60);
    const name = label.de || `Zone ${n}`;
    if (!/^[a-z0-9-]{1,20}$/.test(id)) return errors.push(`${name}: Kennung fehlt oder ungültig (nur a–z, 0–9, -)`);
    if (seenIds.has(id)) return errors.push(`${name}: Kennung „${id}“ kommt doppelt vor`);
    if (!label.de) return errors.push(`Zone ${n}: Name fehlt`);
    const countries: string[] = [];
    for (const c of Array.isArray(z?.countries) ? z.countries : []) {
      const code = str(c, 4).toUpperCase();
      if (!/^[A-Z]{2}$/.test(code)) {
        errors.push(`${name}: „${String(c)}“ ist kein gültiger Ländercode (2 Buchstaben, z. B. AT)`);
        continue;
      }
      if (seenCountries.has(code)) {
        errors.push(`${name}: ${code} ist schon einer anderen Zone zugeordnet`);
        continue;
      }
      seenCountries.add(code);
      countries.push(code);
    }
    if (!countries.length) return errors.push(`${name}: mindestens ein Land angeben`);
    const amount = money(z?.amount);
    if (amount === undefined) return errors.push(`${name}: Versandkosten fehlen oder sind ungültig`);
    const freeFrom = z?.freeFrom === null || z?.freeFrom === '' || z?.freeFrom === undefined ? undefined : money(z.freeFrom);
    if (z?.freeFrom !== undefined && z?.freeFrom !== null && z?.freeFrom !== '' && freeFrom === undefined) {
      errors.push(`${name}: „Gratis ab“ ist ungültig – wird ignoriert`);
    }
    const carrier: CarrierId = z?.carrier === 'dhl-express' ? 'dhl-express' : 'standard';
    const code = str(z?.dhlProductCode, 2).toUpperCase();
    const dhlProductCode = carrier === 'dhl-express' && (code === 'N' || code === 'U') ? code : undefined;
    const delivery = locOr(z?.delivery as RawL, { de: '', en: '' }, 80);
    if (!delivery.de) errors.push(`${name}: Lieferzeit fehlt`);
    seenIds.add(id);
    zones.push({ id, label, countries, amount, freeFrom, delivery, carrier, dhlProductCode });
  });
  return { zones, errors };
}

const defaultZones: Zone[] = defaults.shippingZones.map((z) => ({
  id: z.id,
  label: z.label,
  countries: z.countries,
  amount: z.amount,
  freeFrom: z.freeFrom,
  delivery: z.delivery,
  carrier: 'dhl-express',
  dhlProductCode: z.dhlProductCode,
}));

const placeholder = (s: string) => (s.startsWith('[') ? '' : s);

function buildCompany(raw: Record<string, unknown> | null | undefined): Company {
  const d = defaults.company;
  const pick = (k: keyof typeof d) => str(raw?.[k]) || placeholder(String(d[k] ?? ''));
  const c = {
    name: pick('name'),
    street: pick('street'),
    postalCode: pick('postalCode'),
    city: pick('city'),
    country: /^[A-Za-z]{2}$/.test(str(raw?.country, 20)) ? str(raw?.country).toUpperCase() : d.country || 'AT',
    email: pick('email'),
    phone: pick('phone'),
    trade: pick('trade'),
    authority: pick('authority'),
    uid: pick('uid'),
    register: pick('register'),
  };
  const line2 = [c.postalCode, c.city].filter(Boolean).join(' ');
  return { ...c, address: [c.street, line2].filter(Boolean).join(', ') };
}

// Pflichtangaben fürs Impressum, die noch fehlen
export function companyProblems(c: Company): string[] {
  const missing: string[] = [];
  if (!c.name) missing.push('Firmenname');
  if (!c.street || !c.postalCode || !c.city) missing.push('Anschrift');
  if (!c.email) missing.push('E-Mail');
  if (!c.trade) missing.push('Gewerbe');
  if (!c.authority) missing.push('Gewerbebehörde');
  return missing;
}

export interface RawSettings {
  shop?: Record<string, unknown> | null;
  shipping?: Record<string, unknown> | null;
  texts?: Record<string, unknown> | null;
}

export function mergeShopConfig(raw: RawSettings): ShopConfig {
  const s = raw.shop ?? null;
  const sh = raw.shipping ?? null;
  const t = raw.texts ?? null;

  const validated = validateZones(sh?.zones);
  const zones = validated.zones.length ? validated.zones : defaultZones;

  const p = (sh?.parcel ?? {}) as Record<string, unknown>;
  const dp = defaults.parcel;
  const grams = (v: unknown, d: number) => {
    const n = num(v);
    return n !== undefined && n >= 0 && n <= 70000 ? Math.round(n) : d;
  };
  const cm = (v: unknown, d: number) => {
    const n = num(v);
    return n !== undefined && n > 0 && n <= 300 ? n : d;
  };

  const c = (s?.contact ?? {}) as Record<string, unknown>;
  const texts: ShopConfig['texts'] = {};
  for (const f of TEXT_FIELDS) {
    const v = optionalLoc(t?.[f.key] as RawL);
    if (v) texts[f.key] = v;
  }

  return {
    zones,
    parcel: {
      packagingWeightG: grams(p.packagingWeightG, dp.packagingWeightG),
      defaultItemWeightG: grams(p.defaultItemWeightG, dp.defaultItemWeightG),
      lengthCm: cm(p.lengthCm, dp.lengthCm),
      widthCm: cm(p.widthCm, dp.widthCm),
      heightCm: cm(p.heightCm, dp.heightCm),
      contentDescription: dp.contentDescription,
    },
    company: buildCompany(s?.company as Record<string, unknown> | undefined),
    contact: {
      email: str(c.email) || siteDefaults.email,
      instagram: safeUrl(c.instagram) || siteDefaults.instagram,
      tiktok: safeUrl(c.tiktok) || siteDefaults.tiktok,
      whatsapp: safeUrl(c.whatsapp) || siteDefaults.whatsapp,
    },
    vatNote: locOr(s?.vatNote as RawL, defaults.vatNote, 300),
    packagingNote: locOr(s?.packagingNote as RawL, defaults.packagingNote, 1000),
    texts,
    currency: defaults.currency,
    maxQtyPerItem: defaults.maxQtyPerItem,
    fromCms: { shop: Boolean(s), shipping: validated.zones.length > 0, texts: Boolean(t) },
  };
}

export function safeUrl(v: unknown): string {
  const s = str(v, 500);
  try {
    const u = new URL(s);
    return u.protocol === 'https:' ? u.toString() : '';
  } catch {
    return '';
  }
}

// ---------- Laden ----------

const SETTINGS_QUERY = `{
  "shop": *[_id == "shopSettings"][0],
  "shipping": *[_id == "shippingSettings"][0],
  "texts": *[_id == "siteTexts"][0]
}`;

// fresh = direkt aus der Datenbank (z. B. in der Kasse und im Adminbereich), sonst über den
// schnellen Zwischenspeicher – Änderungen erscheinen im Shop nach spätestens 60 Sekunden.
export async function getShopConfig(opts: { fresh?: boolean } = {}): Promise<ShopConfig> {
  if (!isSanityConfigured) return mergeShopConfig({});
  const host = opts.fresh ? 'api.sanity.io' : 'apicdn.sanity.io';
  const url = `https://${projectId}.${host}/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(SETTINGS_QUERY)}`;
  try {
    const res = await fetch(url, opts.fresh ? { cache: 'no-store' } : { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Sanity ${res.status}`);
    const json = (await res.json()) as { result: RawSettings };
    return mergeShopConfig(json.result ?? {});
  } catch (error) {
    console.error('[Einstellungen] Laden fehlgeschlagen, Startwerte werden verwendet', error);
    return mergeShopConfig({});
  }
}

export async function getTexts(locale: Locale, cfg?: ShopConfig): Promise<Dict> {
  const c = cfg ?? (await getShopConfig());
  return applyTexts(getDict(locale), c.texts, locale);
}

// ---------- Versand-Hilfen ----------

export const shipCountries = (cfg: ShopConfig) => cfg.zones.flatMap((z) => z.countries);

export function zoneFor(cfg: Pick<ShopConfig, 'zones'>, country: string): Zone | undefined {
  return cfg.zones.find((z) => z.countries.includes(country));
}

export function shippingFor(zone: Zone | undefined, subtotal: number): number | undefined {
  if (!zone) return undefined;
  if (zone.freeFrom !== undefined && subtotal >= zone.freeFrom) return 0;
  return zone.amount;
}

export const carrierName = (zone: Zone) => (zone.carrier === 'dhl-express' ? 'DHL Express' : '');
