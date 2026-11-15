import { defineArrayMember, defineField, defineType } from 'sanity';

// Einstellungen, die die Inhaberin im Verwaltungsbereich (/admin) oder hier im CMS ändert.
// Es gibt jeweils genau EIN Dokument (feste IDs: shopSettings, shippingSettings, siteTexts).
// Hier stehen nur öffentliche Angaben – niemals Passwörter, API-Schlüssel oder Bankdaten.

export const shopSettings = defineType({
  name: 'shopSettings',
  title: 'Shop-Informationen',
  type: 'document',
  fields: [
    defineField({
      name: 'company',
      title: 'Unternehmen (Impressum, E-Mails, Absender für Pakete)',
      type: 'object',
      fields: [
        defineField({ name: 'name', title: 'Firmenname / Name der Inhaberin', type: 'string' }),
        defineField({ name: 'street', title: 'Straße und Hausnummer', type: 'string' }),
        defineField({ name: 'postalCode', title: 'PLZ', type: 'string' }),
        defineField({ name: 'city', title: 'Ort', type: 'string' }),
        defineField({ name: 'country', title: 'Land (Code, z. B. AT)', type: 'string', initialValue: 'AT' }),
        defineField({ name: 'email', title: 'E-Mail', type: 'string' }),
        defineField({ name: 'phone', title: 'Telefon (für Versandetiketten Pflicht)', type: 'string' }),
        defineField({ name: 'trade', title: 'Gewerbe', type: 'string' }),
        defineField({ name: 'authority', title: 'Gewerbebehörde', type: 'string' }),
        defineField({ name: 'uid', title: 'UID-Nummer (falls vorhanden)', type: 'string' }),
        defineField({ name: 'register', title: 'Firmenbuch (falls eingetragen)', type: 'string' }),
      ],
    }),
    defineField({
      name: 'contact',
      title: 'Kontakt & Social Media (leere Felder werden nicht angezeigt)',
      type: 'object',
      fields: [
        defineField({ name: 'email', title: 'Kontakt-E-Mail', type: 'string' }),
        defineField({ name: 'instagram', title: 'Instagram-Link', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok-Link', type: 'url' }),
        defineField({ name: 'whatsapp', title: 'WhatsApp-Link', type: 'url' }),
      ],
    }),
    defineField({ name: 'vatNote', title: 'Steuerhinweis (rechtlich prüfen)', type: 'localizedString' }),
    defineField({ name: 'packagingNote', title: 'Hinweis zu Verpackung & Versand', type: 'localizedText' }),
  ],
  preview: { prepare: () => ({ title: 'Shop-Informationen' }) },
});

export const shippingSettings = defineType({
  name: 'shippingSettings',
  title: 'Versand',
  type: 'document',
  fields: [
    defineField({
      name: 'zones',
      title: 'Versandarten / Zonen',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'zone',
          fields: [
            defineField({ name: 'id', title: 'Kennung (z. B. at, eu)', type: 'string', validation: (r) => r.required().regex(/^[a-z0-9-]{1,20}$/) }),
            defineField({ name: 'label', title: 'Name', type: 'localizedString' }),
            defineField({ name: 'countries', title: 'Länder (Codes, z. B. AT, DE)', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
            defineField({ name: 'amount', title: 'Versandkosten (€)', type: 'number', validation: (r) => r.required().min(0) }),
            defineField({ name: 'freeFrom', title: 'Gratis ab Warenwert (€, leer = nie)', type: 'number', validation: (r) => r.min(0) }),
            defineField({ name: 'delivery', title: 'Lieferzeit (Angabe für Kundinnen)', type: 'localizedString' }),
            defineField({
              name: 'carrier',
              title: 'Lieferdienst',
              type: 'string',
              initialValue: 'standard',
              options: { list: [{ title: 'Standardversand (ohne Anbieter-Anbindung)', value: 'standard' }, { title: 'DHL Express (angebunden)', value: 'dhl-express' }] },
            }),
            defineField({
              name: 'dhlProductCode',
              title: 'DHL-Express-Produkt (nur bei DHL Express)',
              type: 'string',
              options: { list: [{ title: 'kein automatisches Etikett', value: '' }, { title: 'N – Domestic Express (AT)', value: 'N' }, { title: 'U – Express Worldwide (EU)', value: 'U' }] },
            }),
          ],
          preview: { select: { title: 'label.de', amount: 'amount' }, prepare: ({ title, amount }) => ({ title, subtitle: `${amount ?? '?'} €` }) },
        }),
      ],
    }),
    defineField({
      name: 'parcel',
      title: 'Paket (für Versandetiketten)',
      type: 'object',
      fields: [
        defineField({ name: 'packagingWeightG', title: 'Gewicht Verpackung (g)', type: 'number' }),
        defineField({ name: 'defaultItemWeightG', title: 'Standardgewicht je Artikel (g)', type: 'number' }),
        defineField({ name: 'lengthCm', title: 'Länge (cm)', type: 'number' }),
        defineField({ name: 'widthCm', title: 'Breite (cm)', type: 'number' }),
        defineField({ name: 'heightCm', title: 'Höhe (cm)', type: 'number' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Versand' }) },
});

const t = (name: string, title: string, long = true) =>
  defineField({ name, title, type: long ? 'localizedText' : 'localizedString' });

export const siteTexts = defineType({
  name: 'siteTexts',
  title: 'Texte (DE / EN)',
  type: 'document',
  fields: [
    t('tagline', 'Slogan', false),
    t('heroTitle', 'Startseite: Überschrift', false),
    t('heroText', 'Startseite: Einleitung'),
    t('storyTitle', 'Startseite: Geschichte – Überschrift', false),
    t('storyText', 'Startseite: Geschichte – Text'),
    t('contactText', 'Startseite: Kontakt – Text'),
    t('aboutBody', 'Seite „Über uns“'),
    t('shippingBody', 'Seite „Versand“ – Einleitung'),
    t('paymentBody', 'Seite „Zahlung“ – Einleitung'),
    t('contactBody', 'Seite „Kontakt“'),
    t('returnsBody', 'Rückgabe & Widerruf (rechtlich prüfen)'),
    t('termsBody', 'AGB (rechtlich prüfen)'),
    t('privacyBody', 'Datenschutz (rechtlich prüfen)'),
    t('imprintBody', 'Impressum – Einleitung (rechtlich prüfen)'),
  ],
  preview: { prepare: () => ({ title: 'Texte (DE / EN)' }) },
});
