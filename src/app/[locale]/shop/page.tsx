import Link from 'next/link';
import { getDict } from '@/lib/dict';
import { isLocale, defaultLocale } from '@/lib/i18n';
import { getCategories, getProducts } from '@/lib/data';
import { filterProducts } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sub?: string }>;
}) {
  const { locale: raw } = await params;
  const { category, sub } = await searchParams;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);

  const [categories, all] = await Promise.all([getCategories(), getProducts()]);
  const list = filterProducts(all, category, sub);
  const activeCategory = categories.find((c) => c.id === category);

  const special: Record<string, string> = {
    new: t.nav.new,
    best: t.nav.bestsellers,
    sale: t.nav.sale,
  };

  const base = `/${locale}/shop`;
  const chip = (href: string, label: string, active: boolean) => (
    <Link key={href} href={href} className={active ? 'chip active' : 'chip'}>
      {label}
    </Link>
  );

  const title = activeCategory
    ? activeCategory.name[locale]
    : category && special[category]
      ? special[category]
      : t.shop.title;

  return (
    <div className="section container">
      <h1>{title}</h1>

      <div className="filters">
        {chip(base, t.shop.all, !category)}
        {categories.map((c) =>
          chip(`${base}?category=${c.id}`, c.name[locale], category === c.id)
        )}
        {chip(`${base}?category=new`, t.nav.new, category === 'new')}
        {chip(`${base}?category=best`, t.nav.bestsellers, category === 'best')}
        {chip(`${base}?category=sale`, t.nav.sale, category === 'sale')}
      </div>

      {activeCategory && activeCategory.children.length > 0 && (
        <div className="filters sub">
          {chip(`${base}?category=${activeCategory.id}`, t.shop.all, !sub)}
          {activeCategory.children.map((s) =>
            chip(
              `${base}?category=${activeCategory.id}&sub=${s.id}`,
              s.name[locale],
              sub === s.id
            )
          )}
        </div>
      )}

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
