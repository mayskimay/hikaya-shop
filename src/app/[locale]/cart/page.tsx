import { getDict } from '@/lib/dict';
import { getProducts } from '@/lib/data';
import { isLocale, defaultLocale } from '@/lib/i18n';
import { stripeMode } from '@/lib/stripe';
import CartView from '@/components/CartView';

export const dynamic = 'force-dynamic';

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const products = await getProducts();
  // Nur die Information "Testmodus ja/nein" geht an den Browser – nie der Schlüssel selbst
  const mode = stripeMode();

  return (
    <div className="section container" style={{ maxWidth: 760 }}>
      <h1>{t.cart.title}</h1>
      <CartView
        locale={locale}
        t={t.cart}
        products={products}
        paymentReady={mode !== null}
        testMode={mode === 'test'}
      />
    </div>
  );
}
