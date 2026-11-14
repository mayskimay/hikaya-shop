'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { formatPrice, type Locale } from '@/lib/i18n';
import type { Dict } from '@/lib/dict';
import { currentPrice, type Product } from '@/lib/products';

export default function CartView({
  locale,
  t,
  products,
}: {
  locale: Locale;
  t: Dict['cart'];
  products: Product[];
}) {
  const { items, remove } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function checkout() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, items }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.error === 'not_configured') setError(t.errNotConfigured);
      else if (data.error === 'stock') setError(`${t.errStock} ${data.name}`);
      else setError(t.errGeneric);
    } catch {
      setError(t.errGeneric);
    }
    setBusy(false);
  }

  const rows = items
    .map((item) => ({ item, product: products.find((p) => p.slug === item.slug) }))
    .filter((r) => r.product !== undefined);

  if (rows.length === 0) {
    return (
      <>
        <p>{t.empty}</p>
        <Link href={`/${locale}/shop`} className="btn btn-outline">
          {t.continue}
        </Link>
      </>
    );
  }

  const total = rows.reduce(
    (sum, { item, product }) => sum + currentPrice(product!) * item.qty,
    0
  );

  return (
    <>
      {rows.map(({ item, product }) => {
        const color = product!.colors.find((c) => c.hex === item.color);
        return (
          <div className="cart-row" key={`${item.slug}-${item.size}-${item.color}`}>
            <div>
              <strong>{product!.name[locale]}</strong>
              <small>
                {item.size} · {color?.name[locale]} · ×{item.qty}
              </small>
              <button
                className="link-btn"
                onClick={() => remove(item.slug, item.size, item.color)}
              >
                {t.remove}
              </button>
            </div>
            <div>{formatPrice(currentPrice(product!) * item.qty, locale)}</div>
          </div>
        );
      })}

      <div className="cart-total">
        <span>{t.total}</span>
        <strong>{formatPrice(total, locale)}</strong>
      </div>

      <button className="btn" onClick={checkout} disabled={busy}>
        {busy ? t.redirecting : t.checkout}
      </button>
      {error && <p className="note" role="alert" style={{ color: 'var(--sale)' }}>{error}</p>}
      <p className="note">{t.checkoutNote}</p>
    </>
  );
}
