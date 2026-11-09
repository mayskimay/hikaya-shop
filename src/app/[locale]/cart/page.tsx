import { getDict } from '@/lib/dict';
import { isLocale, defaultLocale } from '@/lib/i18n';
import CartView from '@/components/CartView';

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);

  return (
    <div className="section container" style={{ maxWidth: 760 }}>
      <h1>{t.cart.title}</h1>
      <CartView locale={locale} t={t.cart} />
    </div>
  );
}
