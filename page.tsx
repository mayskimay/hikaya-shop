import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDict } from '@/lib/dict';
import { formatPrice, isLocale, defaultLocale, locales } from '@/lib/i18n';
import { currentPrice, getProduct, products, sizeGuide } from '@/lib/products';
import AddToCart from '@/components/AddToCart';

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    products.map((p) => ({ locale, slug: p.slug }))
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const product = getProduct(slug);
  if (!product) notFound();

  const onSale = product.salePrice !== undefined;

  return (
    <div className="section container">
      <Link href={`/${locale}/shop`} className="note">
        {t.product.back}
      </Link>

      <div className="product" style={{ marginTop: 20 }}>
        <div className="main-img">{product.name[locale]}</div>

        <div>
          <h1>{product.name[locale]}</h1>
          <p className="price" style={{ fontSize: '1.2rem' }}>
            {onSale && <span className="old">{formatPrice(product.price, locale)}</span>}
            <span className={onSale ? 'now sale' : 'now'}>
              {formatPrice(currentPrice(product), locale)}
            </span>
          </p>
          <p>{product.description[locale]}</p>
          <p className="note">
            {t.product.material}: {product.material[locale]}
          </p>

          <AddToCart product={product} locale={locale} t={t.product} />

          <details>
            <summary>{t.product.sizeGuide}</summary>
            <table className="sizes">
              <thead>
                <tr>
                  <th>{t.product.size}</th>
                  <th>{locale === 'de' ? 'Brust' : 'Chest'} (cm)</th>
                  <th>{locale === 'de' ? 'Taille' : 'Waist'} (cm)</th>
                  <th>{locale === 'de' ? 'Hüfte' : 'Hips'} (cm)</th>
                </tr>
              </thead>
              <tbody>
                {sizeGuide.map((row) => (
                  <tr key={row.size}>
                    <td>{row.size}</td>
                    <td>{row.chest}</td>
                    <td>{row.waist}</td>
                    <td>{row.hips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </div>
    </div>
  );
}
