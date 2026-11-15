import { defineArrayMember, defineField, defineType } from 'sanity';

// Bestellungen werden automatisch nach der Zahlung angelegt (Stripe-Webhook).
// Im Studio kann die Inhaberin den Status ändern (z. B. "Versendet") und Notizen ergänzen.
// Alle übrigen Felder sind schreibgeschützt.

const ro = { readOnly: true };

export const order = defineType({
  name: 'order',
  title: 'Bestellung',
  type: 'document',
  fields: [
    defineField({ name: 'orderNumber', title: 'Bestellnummer', type: 'string', ...ro }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Zahlung ausstehend (z. B. Lastschrift)', value: 'awaiting_payment' },
          { title: 'Bezahlt – bitte versenden', value: 'paid' },
          { title: 'Versendet', value: 'shipped' },
          { title: 'Zugestellt', value: 'delivered' },
          { title: 'Zahlung fehlgeschlagen', value: 'payment_failed' },
          { title: 'Storniert', value: 'cancelled' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'shippingInfo',
      title: 'Versand',
      type: 'string',
      readOnly: true,
      description:
        'Etiketten erstellst du auf der Versand-Seite des Shops (/admin/versand). Dort wird auch die Sendungsnummer eingetragen und die Kundin per E-Mail informiert.',
    }),
    defineField({ name: 'carrier', title: 'Versanddienst', type: 'string', ...ro }),
    defineField({ name: 'trackingNumber', title: 'Sendungsnummer', type: 'string', ...ro }),
    defineField({ name: 'trackingUrl', title: 'Link zur Sendungsverfolgung', type: 'url', ...ro }),
    defineField({ name: 'trackingDescription', title: 'Letzter DHL-Status', type: 'string', ...ro }),
    defineField({ name: 'trackingUpdatedAt', title: 'Status abgefragt am', type: 'datetime', ...ro }),
    defineField({ name: 'shippedAt', title: 'Versendet am', type: 'datetime', ...ro }),
    defineField({ name: 'deliveredAt', title: 'Zugestellt am', type: 'datetime', ...ro }),
    defineField({ name: 'labelCreatedInMode', title: 'Etikett erstellt im Modus', type: 'string', ...ro }),
    defineField({ name: 'labelPdf', title: 'Etikett (PDF)', type: 'text', hidden: true, ...ro }),
    defineField({ name: 'trackingState', type: 'string', hidden: true, ...ro }),
    defineField({ name: 'labelCreatedAt', type: 'datetime', hidden: true, ...ro }),
    defineField({ name: 'notes', title: 'Interne Notizen', type: 'text', rows: 3 }),
    defineField({ name: 'testMode', title: 'Testbestellung (keine echte Zahlung)', type: 'boolean', ...ro }),
    defineField({ name: 'createdAt', title: 'Bestellt am', type: 'datetime', ...ro }),
    defineField({ name: 'paidAt', title: 'Bezahlt am', type: 'datetime', ...ro }),
    defineField({ name: 'email', title: 'E-Mail', type: 'string', ...ro }),
    defineField({ name: 'customerName', title: 'Name', type: 'string', ...ro }),
    defineField({ name: 'phone', title: 'Telefon', type: 'string', ...ro }),
    defineField({ name: 'shippingName', title: 'Empfänger', type: 'string', ...ro }),
    defineField({ name: 'shippingAddress', title: 'Lieferadresse', type: 'text', rows: 4, ...ro }),
    defineField({ name: 'country', title: 'Land', type: 'string', ...ro }),
    defineField({
      name: 'address',
      title: 'Adresse (Felder für DHL)',
      type: 'object',
      ...ro,
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'line1', title: 'Straße', type: 'string' }),
        defineField({ name: 'line2', title: 'Zusatz', type: 'string' }),
        defineField({ name: 'postalCode', title: 'PLZ', type: 'string' }),
        defineField({ name: 'city', title: 'Ort', type: 'string' }),
        defineField({ name: 'country', title: 'Land', type: 'string' }),
      ],
    }),
    defineField({
      name: 'items',
      title: 'Artikel',
      type: 'array',
      ...ro,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'orderItem',
          fields: [
            defineField({ name: 'name', title: 'Produkt', type: 'string' }),
            defineField({ name: 'slug', title: 'Kennung', type: 'string' }),
            defineField({ name: 'size', title: 'Größe', type: 'string' }),
            defineField({ name: 'color', title: 'Farbe', type: 'string' }),
            defineField({ name: 'quantity', title: 'Menge', type: 'number' }),
            defineField({ name: 'unitPrice', title: 'Einzelpreis (€)', type: 'number' }),
            defineField({ name: 'lineTotal', title: 'Summe (€)', type: 'number' }),
          ],
          preview: {
            select: { title: 'name', size: 'size', color: 'color', qty: 'quantity' },
            prepare: ({ title, size, color, qty }) => ({ title, subtitle: `${size} · ${color} · ×${qty}` }),
          },
        }),
      ],
    }),
    defineField({ name: 'subtotal', title: 'Zwischensumme (€)', type: 'number', ...ro }),
    defineField({ name: 'shipping', title: 'Versand (€)', type: 'number', ...ro }),
    defineField({ name: 'total', title: 'Gesamt (€)', type: 'number', ...ro }),
    defineField({ name: 'currency', title: 'Währung', type: 'string', ...ro }),
    defineField({ name: 'paymentMethod', title: 'Zahlungsart', type: 'string', ...ro }),
    defineField({ name: 'locale', title: 'Sprache', type: 'string', ...ro }),
    defineField({ name: 'stripeSessionId', title: 'Stripe-Sitzung', type: 'string', ...ro }),
    defineField({ name: 'stripePaymentIntent', title: 'Stripe-Zahlung', type: 'string', ...ro }),
    defineField({ name: 'stockAdjusted', title: 'Bestand abgebucht', type: 'boolean', ...ro }),
  ],
  orderings: [{ title: 'Neueste zuerst', name: 'newest', by: [{ field: 'createdAt', direction: 'desc' }] }],
  preview: {
    select: { num: 'orderNumber', name: 'customerName', total: 'total', status: 'status', test: 'testMode' },
    prepare({ num, name, total, status, test }) {
      const labels: Record<string, string> = {
        awaiting_payment: 'Zahlung ausstehend',
        paid: 'Bezahlt',
        shipped: 'Versendet',
        delivered: 'Zugestellt',
        payment_failed: 'Fehlgeschlagen',
        cancelled: 'Storniert',
      };
      return {
        title: `${test ? '[TEST] ' : ''}${num ?? ''} – ${name ?? ''}`,
        subtitle: `${labels[status] ?? status ?? ''} · ${typeof total === 'number' ? total.toFixed(2) : '–'} €`,
      };
    },
  },
});
