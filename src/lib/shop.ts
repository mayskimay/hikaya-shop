// Einstellungen für Kasse, Versand und Shop-Angaben. Beträge in Euro.
//
// ⚠️ ALLE WERTE HIER SIND PLATZHALTER und müssen von der Inhaberin festgelegt
//    bzw. rechtlich geprüft werden, bevor echte Bestellungen angenommen werden.

import type { Locale } from './i18n';

type L = Record<Locale, string>;

export interface ShippingZone {
  id: string;
  label: L;
  countries: string[]; // ISO-Ländercodes
  amount: number; // Versandkosten in €
  freeFrom?: number; // ab diesem Warenwert gratis (leer = nie gratis)
  delivery: L; // Lieferzeit-Angabe für Kundinnen
}

export const shop = {
  currency: 'eur',
  maxQtyPerItem: 10,

  // Versandzonen – PLATZHALTER: Preise und Lieferzeiten festlegen.
  // Hinweis: Lieferungen in Nicht-EU-Länder (z. B. Schweiz) können Zoll und
  // Einfuhrumsatzsteuer auslösen – vorher mit Steuerberatung klären.
  shippingZones: [
    {
      id: 'at',
      label: { de: 'Österreich', en: 'Austria' },
      countries: ['AT'],
      amount: 4.9,
      freeFrom: 100,
      delivery: { de: '2–4 Werktage', en: '2–4 business days' },
    },
    {
      id: 'eu',
      label: { de: 'EU', en: 'EU' },
      countries: ['DE', 'IT', 'FR', 'NL', 'BE', 'LU', 'ES', 'PT', 'CZ', 'SK', 'HU', 'SI', 'PL', 'HR', 'DK', 'SE', 'FI', 'IE'],
      amount: 9.9,
      freeFrom: 150,
      delivery: { de: '4–7 Werktage', en: '4–7 business days' },
    },
    {
      id: 'ch',
      label: { de: 'Schweiz', en: 'Switzerland' },
      countries: ['CH'],
      amount: 19.9,
      delivery: { de: '5–10 Werktage, zzgl. möglicher Zollgebühren', en: '5–10 business days, plus possible customs fees' },
    },
  ] as ShippingZone[],

  // Steuerhinweis, der im Warenkorb und in E-Mails erscheint – PLATZHALTER.
  // Kleinunternehmerin (AT): z. B. „Gemäß § 6 Abs. 1 Z 27 UStG wird keine Umsatzsteuer berechnet.“
  // Sonst: „Alle Preise inkl. gesetzlicher USt.“ – mit Steuerberatung klären.
  vatNote: {
    de: 'Alle Preise inkl. gesetzlicher USt. (Platzhalter – Steuerangabe noch prüfen)',
    en: 'All prices incl. VAT where applicable (placeholder – tax wording still to be checked)',
  } as L,

  // Pflichtangaben des Unternehmens (Impressum, E-Mails) – PLATZHALTER.
  company: {
    name: '[Firmenname / Name der Inhaberin]',
    address: '[Straße Nr., PLZ Ort, Österreich]',
    email: '[E-Mail-Adresse]',
    phone: '',
    uid: '', // UID-Nummer, falls vorhanden
    register: '', // Firmenbuchnummer + Gericht, falls eingetragen
    authority: '[Zuständige Gewerbebehörde]',
    trade: '[Gewerbe, z. B. Handelsgewerbe]',
  },
};

export const allShippingCountries = shop.shippingZones.flatMap((z) => z.countries);

export function zoneForCountry(country: string): ShippingZone | undefined {
  return shop.shippingZones.find((z) => z.countries.includes(country));
}

// Versandkosten in Euro für ein Land und einen Warenwert (in Euro)
export function shippingCost(country: string, subtotal: number): number | undefined {
  const zone = zoneForCountry(country);
  if (!zone) return undefined;
  if (zone.freeFrom !== undefined && subtotal >= zone.freeFrom) return 0;
  return zone.amount;
}

// Ländernamen für die Auswahl im Warenkorb
export function countryName(code: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale === 'de' ? 'de-AT' : 'en-GB'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
