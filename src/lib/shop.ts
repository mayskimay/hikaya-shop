// STARTWERTE für Kasse, Versand und Shop-Angaben. Beträge in Euro.
//
// Die Inhaberin ändert diese Angaben im Verwaltungsbereich (/admin → Versand, Shop-Infos).
// Die Werte hier gelten nur, solange dort noch nichts gespeichert ist (siehe src/lib/settings.ts).
// ⚠️ ALLE WERTE HIER SIND PLATZHALTER und müssen festgelegt bzw. rechtlich geprüft werden.

import type { Locale } from './i18n';

type L = Record<Locale, string>;

export interface ShippingZone {
  id: string;
  label: L;
  carrier: string; // Anzeige im Checkout, z. B. "DHL Express"
  // DHL-Express-Produktcode für diese Zone (muss im DHL-Vertrag freigeschaltet sein):
  // N = Domestic Express (innerhalb AT), U = Express Worldwide (EU), P = Express Worldwide (Nicht-EU, Zoll nötig)
  dhlProductCode?: string;
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
      carrier: 'DHL Express',
      dhlProductCode: 'N',
      countries: ['AT'],
      amount: 4.9,
      freeFrom: 100,
      delivery: { de: '2–4 Werktage', en: '2–4 business days' },
    },
    {
      id: 'eu',
      label: { de: 'EU', en: 'EU' },
      carrier: 'DHL Express',
      dhlProductCode: 'U',
      countries: ['DE', 'IT', 'FR', 'NL', 'BE', 'LU', 'ES', 'PT', 'CZ', 'SK', 'HU', 'SI', 'PL', 'HR', 'DK', 'SE', 'FI', 'IE'],
      amount: 9.9,
      freeFrom: 150,
      delivery: { de: '4–7 Werktage', en: '4–7 business days' },
    },
    {
      id: 'ch',
      label: { de: 'Schweiz', en: 'Switzerland' },
      carrier: 'DHL Express',
      // Kein automatisches Etikett: Nicht-EU braucht Zoll-/Exportdaten → Etikett im MyDHL-Portal erstellen
      countries: ['CH'],
      amount: 19.9,
      delivery: { de: '5–10 Werktage, zzgl. möglicher Zollgebühren', en: '5–10 business days, plus possible customs fees' },
    },
  ] as ShippingZone[],

  // Versand & Verpackung – PLATZHALTER: an Verpackungsmaterial und DHL-Vertrag anpassen
  parcel: {
    packagingWeightG: 300, // Gewicht der Verpackung in Gramm
    defaultItemWeightG: 600, // falls bei einem Produkt kein Gewicht eingetragen ist
    lengthCm: 35,
    widthCm: 25,
    heightCm: 8,
    contentDescription: 'Clothing', // Inhaltsbeschreibung für DHL (englisch)
  },
  // Hinweis zu Verpackung und Versand im Warenkorb und auf der Versandseite
  packagingNote: {
    de: 'Deine Bestellung wird sorgfältig verpackt. Nach dem Versand bekommst du eine E-Mail mit Sendungsnummer zur Sendungsverfolgung.',
    en: 'Your order is carefully packed. Once shipped, you will receive an email with a tracking number.',
  } as L,

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
    phone: '', // für DHL-Etiketten PFLICHT (Absender-Telefon), z. B. '+43 ...'
    // Absenderadresse für DHL-Etiketten, getrennt nach Feldern – PLATZHALTER
    street: '',
    postalCode: '',
    city: '',
    country: 'AT',
    uid: '', // UID-Nummer, falls vorhanden
    register: '', // Firmenbuchnummer + Gericht, falls eingetragen
    authority: '[Zuständige Gewerbebehörde]',
    trade: '[Gewerbe, z. B. Handelsgewerbe]',
  },
};

// Ländernamen für die Auswahl im Warenkorb
export function countryName(code: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale === 'de' ? 'de-AT' : 'en-GB'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
