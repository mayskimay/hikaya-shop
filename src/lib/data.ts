// Holt Produkte und Kategorien aus Sanity (dem CMS).
// Ist Sanity noch nicht eingerichtet, werden die Beispieldaten aus
// products.ts und categories.ts verwendet.

import { apiVersion, dataset, isSanityConfigured, projectId } from '@/sanity/env';
import { categories as localCategories, type Category } from './categories';
import { products as localProducts, type Product } from './products';
import type { Locale } from './i18n';

type L = Record<Locale, string>;
type RawL = { de?: string | null; en?: string | null } | null | undefined;

// Ist nur eine Sprache ausgefüllt, wird sie für beide verwendet.
const loc = (v: RawL): L => ({ de: v?.de ?? v?.en ?? '', en: v?.en ?? v?.de ?? '' });

async function query<T>(groq: string): Promise<T> {
  const url = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(groq)}`;
  // Änderungen im CMS erscheinen im Shop nach spätestens 60 Sekunden.
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Sanity-Abfrage fehlgeschlagen (${res.status})`);
  const json = (await res.json()) as { result: T };
  return json.result;
}

interface RawProduct {
  slug: string;
  name: RawL;
  description: RawL;
  material: RawL;
  category: string | null;
  sub: string | null;
  price: number | null;
  salePrice: number | null;
  bestseller: boolean | null;
  isNew: boolean | null;
  colors: { name: RawL; hex: string | null }[] | null;
  sizes: string[] | null;
  stock: number | null;
  images: (string | null)[] | null;
}

const PRODUCTS_QUERY = `*[_type == "product" && defined(slug.current)] | order(_createdAt desc) {
  "slug": slug.current,
  name, description, material,
  "category": category->slug.current,
  "sub": subcategory->slug.current,
  price, salePrice, bestseller, isNew,
  "colors": colors[]{ name, hex },
  sizes, stock,
  "images": images[].asset->url
}`;

function mapProduct(r: RawProduct): Product {
  const colors = (r.colors ?? [])
    .filter((c) => c?.hex)
    .map((c) => ({ name: loc(c.name), hex: c.hex as string }));

  return {
    slug: r.slug,
    name: loc(r.name),
    description: loc(r.description),
    material: loc(r.material),
    category: r.category ?? '',
    sub: r.sub ?? undefined,
    price: r.price ?? 0,
    salePrice: r.salePrice && r.salePrice > 0 ? r.salePrice : undefined,
    bestseller: r.bestseller ?? false,
    isNew: r.isNew ?? false,
    colors: colors.length ? colors : [{ name: { de: 'Standard', en: 'Default' }, hex: '#cfcfc4' }],
    sizes: r.sizes && r.sizes.length ? r.sizes : ['One size'],
    stock: r.stock ?? 0,
    images: (r.images ?? []).filter((u): u is string => Boolean(u)),
  };
}

export async function getProducts(): Promise<Product[]> {
  if (!isSanityConfigured) return localProducts;
  try {
    const raw = await query<RawProduct[]>(PRODUCTS_QUERY);
    return raw.map(mapProduct);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug);
}

interface RawCategory {
  id: string;
  title: RawL;
  parent: string | null;
}

const CATEGORIES_QUERY = `*[_type == "category" && defined(slug.current)] | order(order asc, _createdAt asc) {
  "id": slug.current,
  title,
  "parent": parent->slug.current
}`;

export async function getCategories(): Promise<Category[]> {
  if (!isSanityConfigured) return localCategories;
  try {
    const raw = await query<RawCategory[]>(CATEGORIES_QUERY);
    return raw
      .filter((c) => !c.parent)
      .map((top) => ({
        id: top.id,
        name: loc(top.title),
        children: raw
          .filter((c) => c.parent === top.id)
          .map((c) => ({ id: c.id, name: loc(c.title) })),
      }));
  } catch (error) {
    console.error(error);
    return [];
  }
}
