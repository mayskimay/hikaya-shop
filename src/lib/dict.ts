import type { Locale } from './i18n';

const de = {
  brand: 'Hikaya',
  tagline: 'Mode mit einer Geschichte',
  skip: 'Überspringen',
  nav: {
    shop: 'Shop',
    new: 'Neuheiten',
    bestsellers: 'Bestseller',
    sale: 'Sale',
    cart: 'Warenkorb',
    menu: 'Menü',
  },
  home: {
    heroTitle: 'Jedes Stück erzählt eine Geschichte',
    heroText:
      'Elegante, feminine Mode mit einem Hauch von Märchen. Entdecke Kimonos, Röcke, Sets und Kleider.',
    heroCta: 'Kollektion entdecken',
    categoriesTitle: 'Kategorien',
    bestsellersTitle: 'Bestseller',
    newTitle: 'Neuheiten',
    saleTitle: 'Sale',
    viewAll: 'Alle ansehen',
    storyTitle: 'Eine kleine Welt für sich',
    storyText:
      'Hikaya bedeutet „Märchen“. Jedes Stück soll sich anfühlen wie ein Kapitel einer leisen, eleganten Geschichte.',
    storyCta: 'Mehr über Hikaya',
    contactTitle: 'Bleib in Kontakt',
    contactText:
      'Fragen zu Größen, Bestellungen oder Styling? Wir freuen uns auf deine Nachricht.',
    contactCta: 'Kontakt aufnehmen',
    followUs: 'Folge uns',
  },
  shop: {
    title: 'Shop',
    all: 'Alle',
    empty: 'In dieser Kategorie gibt es noch keine Produkte.',
  },
  product: {
    size: 'Größe',
    color: 'Farbe',
    material: 'Material',
    sizeGuide: 'Größentabelle',
    addToCart: 'In den Warenkorb',
    added: 'Hinzugefügt ✓',
    sale: 'Sale',
    back: '← Zurück zum Shop',
  },
  cart: {
    title: 'Warenkorb',
    empty: 'Dein Warenkorb ist leer.',
    remove: 'Entfernen',
    total: 'Gesamt',
    checkout: 'Zur Kasse',
    checkoutNote:
      'Die Zahlung (Stripe) wird im nächsten Schritt angebunden.',
    continue: 'Weiter einkaufen',
  },
  footer: {
    about: 'Über uns',
    shipping: 'Versand',
    payment: 'Zahlung',
    returns: 'Rückgabe & Umtausch',
    contact: 'Kontakt',
    privacy: 'Datenschutz',
    terms: 'AGB',
    rights: 'Alle Rechte vorbehalten.',
  },
  info: {
    about: { title: 'Über uns', body: 'Hier steht später die Geschichte von Hikaya.' },
    shipping: { title: 'Versand', body: 'Hier stehen später die Versandinformationen.' },
    payment: { title: 'Zahlung', body: 'Hier stehen später die Zahlungsmethoden.' },
    returns: { title: 'Rückgabe & Umtausch', body: 'Hier stehen später die Rückgabebedingungen.' },
    contact: { title: 'Kontakt', body: 'Hier kommt später das Kontaktformular hin.' },
    privacy: { title: 'Datenschutz', body: 'Platzhalter. Die rechtlichen Texte müssen vor dem Start rechtssicher erstellt werden.' },
    terms: { title: 'AGB', body: 'Platzhalter. Die rechtlichen Texte müssen vor dem Start rechtssicher erstellt werden.' },
  },
};

export type Dict = typeof de;

const en: Dict = {
  brand: 'Hikaya',
  tagline: 'Fashion with a story',
  skip: 'Skip',
  nav: {
    shop: 'Shop',
    new: 'New arrivals',
    bestsellers: 'Bestsellers',
    sale: 'Sale',
    cart: 'Cart',
    menu: 'Menu',
  },
  home: {
    heroTitle: 'Every piece tells a story',
    heroText:
      'Elegant, feminine fashion with a touch of fairytale. Discover kimonos, skirts, sets and dresses.',
    heroCta: 'Discover the collection',
    categoriesTitle: 'Categories',
    bestsellersTitle: 'Bestsellers',
    newTitle: 'New arrivals',
    saleTitle: 'Sale',
    viewAll: 'View all',
    storyTitle: 'A little world of its own',
    storyText:
      'Hikaya means “fairytale”. Every piece should feel like a chapter of a quiet, elegant story.',
    storyCta: 'More about Hikaya',
    contactTitle: 'Stay in touch',
    contactText:
      'Questions about sizing, orders or styling? We would love to hear from you.',
    contactCta: 'Get in touch',
    followUs: 'Follow us',
  },
  shop: {
    title: 'Shop',
    all: 'All',
    empty: 'There are no products in this category yet.',
  },
  product: {
    size: 'Size',
    color: 'Color',
    material: 'Material',
    sizeGuide: 'Size guide',
    addToCart: 'Add to cart',
    added: 'Added ✓',
    sale: 'Sale',
    back: '← Back to shop',
  },
  cart: {
    title: 'Cart',
    empty: 'Your cart is empty.',
    remove: 'Remove',
    total: 'Total',
    checkout: 'Checkout',
    checkoutNote: 'Payment (Stripe) will be connected in the next step.',
    continue: 'Continue shopping',
  },
  footer: {
    about: 'About us',
    shipping: 'Shipping',
    payment: 'Payment',
    returns: 'Returns & exchanges',
    contact: 'Contact',
    privacy: 'Privacy policy',
    terms: 'Terms & conditions',
    rights: 'All rights reserved.',
  },
  info: {
    about: { title: 'About us', body: 'The story of Hikaya will be added here.' },
    shipping: { title: 'Shipping', body: 'Shipping information will be added here.' },
    payment: { title: 'Payment', body: 'Payment methods will be added here.' },
    returns: { title: 'Returns & exchanges', body: 'Return conditions will be added here.' },
    contact: { title: 'Contact', body: 'The contact form will be added here.' },
    privacy: { title: 'Privacy policy', body: 'Placeholder. Legal texts must be professionally drafted before launch.' },
    terms: { title: 'Terms & conditions', body: 'Placeholder. Legal texts must be professionally drafted before launch.' },
  },
};

const dicts: Record<Locale, Dict> = { de, en };

export function getDict(locale: Locale): Dict {
  return dicts[locale];
}
