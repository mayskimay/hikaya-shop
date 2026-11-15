// Daten für den Verwaltungsbereich (mit Schreib-Token, ohne Zwischenspeicher). NUR auf dem Server.

import { canStoreOrders, sanityQuery } from './orders';
import { getProducts, getCategories } from './data';
import { isSanityConfigured } from '@/sanity/env';

export interface AdminProduct {
  _id: string;
  slug: string;
  name: string;
  category: string;
  sub: string;
  price: number;
  salePrice?: number;
  stock: number;
  sizes: string[];
  colors: string[];
  image?: string;
  imageCount: number;
  hasDraft: boolean;
}

export async function adminProducts(): Promise<{ editable: boolean; products: AdminProduct[] }> {
  if (canStoreOrders()) {
    const products = await sanityQuery<AdminProduct[]>(`*[_type == "product" && !(_id in path("drafts.**"))] | order(_createdAt desc){
      _id, "slug": slug.current, "name": coalesce(name.de, name.en, "(ohne Namen)"),
      "category": coalesce(category->title.de, ""), "sub": coalesce(subcategory->title.de, ""),
      "price": coalesce(price, 0), salePrice, "stock": coalesce(stock, 0), "sizes": coalesce(sizes, []),
      "colors": coalesce(colors[].name.de, []), "image": images[0].asset->url + "?w=120&h=150&fit=crop",
      "imageCount": count(images), "hasDraft": defined(*[_id == "drafts." + ^._id][0]._id)
    }`);
    return { editable: true, products };
  }
  // Ohne Sanity: Beispielprodukte nur anzeigen
  const local = await getProducts();
  return {
    editable: false,
    products: local.map((p) => ({
      _id: p.slug,
      slug: p.slug,
      name: p.name.de,
      category: p.category,
      sub: p.sub ?? '',
      price: p.price,
      salePrice: p.salePrice,
      stock: p.stock,
      sizes: p.sizes,
      colors: p.colors.map((c) => c.name.de),
      image: p.images[0],
      imageCount: p.images.length,
      hasDraft: false,
    })),
  };
}

export interface AdminCategory {
  _id: string;
  slug: string;
  title: string;
  titleEn: string;
  parent: string | null;
  order: number;
  count: number;
}

export async function adminCategories(): Promise<{ editable: boolean; categories: AdminCategory[] }> {
  if (canStoreOrders()) {
    const categories = await sanityQuery<AdminCategory[]>(`*[_type == "category" && !(_id in path("drafts.**"))] | order(order asc, _createdAt asc){
      _id, "slug": slug.current, "title": coalesce(title.de, title.en, "(ohne Namen)"), "titleEn": coalesce(title.en, ""),
      "parent": parent._ref, "order": coalesce(order, 100),
      "count": count(*[_type == "product" && !(_id in path("drafts.**")) && (category._ref == ^._id || subcategory._ref == ^._id)])
    }`);
    return { editable: true, categories };
  }
  const local = await getCategories();
  return {
    editable: false,
    categories: local.flatMap((c, i) => [
      { _id: c.id, slug: c.id, title: c.name.de, titleEn: c.name.en, parent: null, order: i, count: 0 },
      ...c.children.map((s, j) => ({ _id: s.id, slug: s.id, title: s.name.de, titleEn: s.name.en, parent: c.id, order: j, count: 0 })),
    ]),
  };
}

export const studioReady = isSanityConfigured;
export const studioEdit = (id: string, type: string) => `/studio/intent/edit/id=${encodeURIComponent(id)};type=${type}/`;
export const studioCreate = (type: string) => `/studio/intent/create/template=${type};type=${type}/`;
