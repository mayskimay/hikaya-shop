import Link from 'next/link';
import { getDict } from '@/lib/dict';
import { isLocale, defaultLocale } from '@/lib/i18n';
import { categoryIds, products } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const bestsellers = products.filter((p) => p.bestseller);

  return (
    <>
      <section className="hero">
        <h1>{t.home.heroTitle}</h1>
        <p>{t.home.heroText}</p>
        <Link href={`/${locale}/shop`} className="btn">
          {t.home.heroCta}
        </Link>
      </section>

      <section className="section container">
        <h2>{t.home.categoriesTitle}</h2>
        <div className="cat-grid">
          {categoryIds.map((id) => (
            <Link key={id} href={`/${locale}/shop?category=${id}`} className="cat-tile">
              {t.categories[id]}
            </Link>
          ))}
        </div>
      </section>

      {bestsellers.length > 0 && (
        <section className="section container">
          <h2>{t.home.bestsellersTitle}</h2>
          <div className="grid">
            {bestsellers.map((p) => (
              <ProductCard key={p.slug} product={p} locale={locale} saleLabel={t.product.sale} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
