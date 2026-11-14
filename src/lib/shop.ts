// Einstellungen für Kasse und Versand. Beträge in Euro.
// Diese Werte sind Platzhalter und müssen von der Inhaberin festgelegt werden.

export const shop = {
  // Versandländer, die an der Kasse zur Auswahl stehen (ISO-Codes)
  countries: [
    'AT', 'DE', 'CH', 'IT', 'FR', 'NL', 'BE', 'LU', 'ES', 'PT', 'CZ', 'SK', 'HU', 'SI', 'PL',
  ],
  // Pauschale Versandkosten, ab dem Betrag "freeFrom" ist der Versand gratis
  shipping: {
    label: { de: 'Standardversand', en: 'Standard shipping' },
    amount: 5.9,
    freeFrom: 100,
  },
  maxQtyPerItem: 10,
};
