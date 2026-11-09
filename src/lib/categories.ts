import type { Locale } from './i18n';

type L = Record<Locale, string>;

export interface SubCategory {
  id: string;
  name: L;
}

export interface Category {
  id: string;
  name: L;
  children: SubCategory[];
}

// Neue Kategorie oder Unterkategorie? Einfach hier einen Eintrag ergänzen.
// Später kommt diese Struktur aus dem CMS.
export const categories: Category[] = [
  {
    id: 'outerwear',
    name: { de: 'Outerwear', en: 'Outerwear' },
    children: [{ id: 'kimono', name: { de: 'Kimono', en: 'Kimono' } }],
  },
  {
    id: 'bottoms',
    name: { de: 'Unterteile', en: 'Bottoms' },
    children: [
      { id: 'skirts', name: { de: 'Röcke', en: 'Skirts' } },
      { id: 'denim-skirts', name: { de: 'Denim-Röcke', en: 'Denim skirts' } },
      { id: 'balloon-skirts', name: { de: 'Ballonröcke', en: 'Balloon skirts' } },
    ],
  },
  {
    id: 'sets',
    name: { de: 'Kostüme / Sets', en: 'Suits / Sets' },
    children: [
      { id: 'three-piece', name: { de: 'Dreiteilige Kostüme', en: 'Three-piece suits' } },
      { id: 'kimono-set', name: { de: 'Kimono-Set', en: 'Kimono set' } },
      { id: 'sport-sets', name: { de: 'Trainingsanzüge / Sport-Sets', en: 'Tracksuits / Sport sets' } },
      { id: 'ramadan-set', name: { de: 'Ramadan-Set', en: 'Ramadan set' } },
    ],
  },
  {
    id: 'dresses',
    name: { de: 'Kleider', en: 'Dresses' },
    children: [{ id: 'mini-dresses', name: { de: 'Mini-Kleider', en: 'Mini dresses' } }],
  },
];

export function getCategory(id: string | undefined): Category | undefined {
  return categories.find((c) => c.id === id);
}
