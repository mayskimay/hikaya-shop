import Link from 'next/link';
import { formatPrice, type Locale } from '@/lib/i18n';
import { currentPrice, type Product } from '@/lib/products';

export default function ProductCard({
  product,
  locale,
  saleLabel,
}: {
  product: Product;
  locale: Locale;
  saleLabel: string;
}) {
  const onSale = product.salePrice !== undefined;
  return (
    <Link href={`/${locale}/product/${product.slug}`} className="card">
      <div className="img">
        {onSale && <span className="badge">{saleLabel}</span>}
        {/* Platzhalter, bis echte Fotos vorhanden sind */}
        <span className="ph">{product.name[locale]}</span>
      </div>
      <h3>{product.name[locale]}</h3>
      <div className="price">
        {onSale && <span className="old">{formatPrice(product.price, locale)}</span>}
        <span className={onSale ? 'now sale' : 'now'}>
          {formatPrice(currentPrice(product), locale)}
        </span>
      </div>
    </Link>
  );
}
