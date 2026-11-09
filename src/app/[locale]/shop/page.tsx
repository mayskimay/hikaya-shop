import Link from 'next/link';
import { getDict } from '@/lib/dict';
import { isLocale, defaultLocale } from '@/lib/i18n';
import { categoryIds, products } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale: raw } = await params;
  const { category } = await searchParams;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);

  let list = products;
  if (category === 'bestsellers') list = products.filter((p) => p.bestseller);
  else if (category === 'sale') list = products.filter((p) => p.salePrice !== undefined);
  else if (category && (categoryIds as string[]).includes(category))
    list = products.filter((p) => p.category === category);

  const chips: { key: string; label: string }[] = [
    { key: '', label: t.shop.all },
    ...categoryIds.map((id) => ({ key: id, label: t.categories[id] })),
    { key: 'bestsellers', label: t.nav.bestsellers },
    { key: 'sale', label: t.nav.sale },
  ];
  const active = category ?? '';

  return (
    <div className="section container">
      <h1>{t.shop.title}</h1>
      <div className="filters">
        {chips.map((c) => (
          <Link
            key={c.key}
            href={c.key ? `/${locale}/shop?category=${c.key}` : `/${locale}/shop`}
            className={active === c.key ? 'chip active' : 'chip'}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <p>{t.shop.empty}</p>
      ) : (
        <div className="grid">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} locale={locale} saleLabel={t.product.sale} />
          ))}
        </div>
      )}
    </div>
  );
}
