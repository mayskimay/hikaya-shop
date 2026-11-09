import type { Locale } from './i18n';

// Später kommen diese Daten aus dem CMS (z. B. Sanity).
// Die Struktur ist so gewählt, dass der Wechsel einfach bleibt.

type L = Record<Locale, string>;

export interface Product {
  slug: string;
  name: L;
  description: L;
  material: L;
  category: string; // id aus categories.ts
  sub?: string; // Unterkategorie, id aus categories.ts
  price: number;
  salePrice?: number;
  bestseller?: boolean;
  isNew?: boolean;
  colors: { name: L; hex: string }[];
  sizes: string[];
  stock: number;
  images: string[]; // später echte Fotos, z. B. /products/kimono-1.jpg
}

export const products: Product[] = [
  {
    slug: 'kimono-nacht',
    name: { de: 'Kimono „Nacht“', en: 'Kimono “Night”' },
    description: {
      de: 'Fließender Kimono mit weiten Ärmeln, leicht und elegant.',
      en: 'Flowing kimono with wide sleeves, light and elegant.',
    },
    material: { de: '100 % Viskose', en: '100% viscose' },
    category: 'outerwear',
    sub: 'kimono',
    price: 89,
    bestseller: true,
    colors: [
      { name: { de: 'Schwarz', en: 'Black' }, hex: '#2b2b2b' },
      { name: { de: 'Sand', en: 'Sand' }, hex: '#d8c8b0' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 12,
    images: [],
  },
  {
    slug: 'ballonrock-salbei',
    name: { de: 'Ballonrock „Salbei“', en: 'Balloon skirt “Sage”' },
    description: {
      de: 'Voluminöser Ballonrock mit elastischem Bund.',
      en: 'Voluminous balloon skirt with an elastic waistband.',
    },
    material: { de: '95 % Baumwolle, 5 % Elastan', en: '95% cotton, 5% elastane' },
    category: 'bottoms',
    sub: 'balloon-skirts',
    price: 59,
    salePrice: 44,
    colors: [{ name: { de: 'Salbei', en: 'Sage' }, hex: '#a9b8a0' }],
    sizes: ['S', 'M', 'L'],
    stock: 8,
    images: [],
  },
  {
    slug: 'denim-rock-klassik',
    name: { de: 'Denim-Rock „Klassik“', en: 'Denim skirt “Classic”' },
    description: {
      de: 'Langer Denim-Rock in klassischer Waschung.',
      en: 'Long denim skirt in a classic wash.',
    },
    material: { de: '100 % Baumwolle', en: '100% cotton' },
    category: 'bottoms',
    sub: 'denim-skirts',
    price: 69,
    isNew: true,
    colors: [{ name: { de: 'Blau', en: 'Blue' }, hex: '#6f85a3' }],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 15,
    images: [],
  },
  {
    slug: 'dreiteiler-perle',
    name: { de: 'Dreiteiliges Kostüm „Perle“', en: 'Three-piece suit “Pearl”' },
    description: {
      de: 'Passendes Set aus drei Teilen, perfekt für besondere Anlässe.',
      en: 'Matching three-piece set, perfect for special occasions.',
    },
    material: { de: '70 % Polyester, 30 % Viskose', en: '70% polyester, 30% viscose' },
    category: 'sets',
    sub: 'three-piece',
    price: 149,
    bestseller: true,
    colors: [
      { name: { de: 'Creme', en: 'Cream' }, hex: '#efe6d6' },
      { name: { de: 'Mokka', en: 'Mocha' }, hex: '#8b6f5c' },
    ],
    sizes: ['S', 'M', 'L'],
    stock: 6,
    images: [],
  },
  {
    slug: 'minikleid-rose',
    name: { de: 'Mini-Kleid „Rosé“', en: 'Mini dress “Rosé”' },
    description: {
      de: 'Zartes Mini-Kleid mit femininem Schnitt.',
      en: 'Delicate mini dress with a feminine cut.',
    },
    material: { de: '100 % Viskose', en: '100% viscose' },
    category: 'dresses',
    sub: 'mini-dresses',
    price: 79,
    isNew: true,
    colors: [{ name: { de: 'Altrosa', en: 'Dusty rose' }, hex: '#d9b3ab' }],
    sizes: ['XS', 'S', 'M'],
    stock: 10,
    images: [],
  },
];

export const sizeGuide = [
  { size: 'XS', chest: '80–84', waist: '62–66', hips: '88–92' },
  { size: 'S', chest: '84–88', waist: '66–70', hips: '92–96' },
  { size: 'M', chest: '88–92', waist: '70–74', hips: '96–100' },
  { size: 'L', chest: '92–96', waist: '74–78', hips: '100–104' },
  { size: 'XL', chest: '96–100', waist: '78–82', hips: '104–108' },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function currentPrice(p: Product): number {
  return p.salePrice ?? p.price;
}

// category: eine Hauptkategorie-id oder 'new' | 'best' | 'sale'
export function filterProducts(category?: string, sub?: string): Product[] {
  if (category === 'new') return products.filter((p) => p.isNew);
  if (category === 'best') return products.filter((p) => p.bestseller);
  if (category === 'sale') return products.filter((p) => p.salePrice !== undefined);
  let list = products;
  if (category) list = list.filter((p) => p.category === category);
  if (sub) list = list.filter((p) => p.sub === sub);
  return list;
}
