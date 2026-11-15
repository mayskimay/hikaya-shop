'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart';
import { formatPrice, type Locale } from '@/lib/i18n';
import type { Dict } from '@/lib/dict';
import { currentPrice, type Product } from '@/lib/products';
import { countryName } from '@/lib/shop';
import type { Zone } from '@/lib/settings';

const COUNTRY_KEY = 'hikaya-country';

export default function CartView({
  locale,
  t,
  products,
  paymentReady,
  testMode,
  carrierLive,
  zones,
  vatNote,
  packagingNote,
  maxQty,
}: {
  locale: Locale;
  t: Dict['cart'];
  products: Product[];
  paymentReady: boolean;
  testMode: boolean;
  carrierLive: boolean; // DHL Express nur nennen, wenn es wirklich verbunden ist
  zones: Zone[]; // Versandzonen aus /admin → Versand
  vatNote: string;
  packagingNote: string;
  maxQty: number;
}) {
  const zoneForCountry = (c: string) => zones.find((z) => z.countries.includes(c));
  const { items, remove, setQty } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [country, setCountry] = useState('AT');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COUNTRY_KEY);
      if (saved && zoneForCountry(saved)) setCountry(saved);
    } catch {}
  }, []);

  function chooseCountry(c: string) {
    setCountry(c);
    try {
      localStorage.setItem(COUNTRY_KEY, c);
    } catch {}
  }

  async function checkout() {
    setError('');
    if (!accepted) return setError(t.errTerms);
    if (!zoneForCountry(country)) return setError(t.errCountry);
    setBusy(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, items, country, acceptedTerms: accepted }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.error === 'not_configured') setError(t.errNotConfigured);
      else if (data.error === 'stock') setError(`${t.errStock} ${data.name}`);
      else if (data.error === 'terms') setError(t.errTerms);
      else if (data.error === 'country') setError(t.errCountry);
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

  const subtotal = rows.reduce((sum, { item, product }) => sum + currentPrice(product!) * item.qty, 0);
  const zone = zoneForCountry(country);
  const ship = zone ? (zone.freeFrom !== undefined && subtotal >= zone.freeFrom ? 0 : zone.amount) : 0;
  const showCarrier = carrierLive && zone?.carrier === 'dhl-express';
  const countries = zones
    .flatMap((z) => z.countries)
    .map((c) => ({ code: c, name: countryName(c, locale) }))
    .sort((a, b) => (a.code === 'AT' ? -1 : b.code === 'AT' ? 1 : a.name.localeCompare(b.name, locale)));

  return (
    <>
      {testMode && <p className="notice">{t.testMode}</p>}

      {rows.map(({ item, product }) => {
        const color = product!.colors.find((c) => c.hex === item.color);
        const max = Math.min(maxQty, product!.stock);
        return (
          <div className="cart-row" key={`${item.slug}-${item.size}-${item.color}`}>
            <div>
              <Link href={`/${locale}/product/${item.slug}`}>
                <strong>{product!.name[locale]}</strong>
              </Link>
              <small>
                {item.size} · {color?.name[locale]}
              </small>
              <div className="qty" aria-label={t.qty}>
                <button
                  type="button"
                  aria-label={t.less}
                  onClick={() => setQty(item.slug, item.size, item.color, item.qty - 1)}
                >
                  −
                </button>
                <span>{item.qty}</span>
                <button
                  type="button"
                  aria-label={t.more}
                  disabled={item.qty >= max}
                  onClick={() => setQty(item.slug, item.size, item.color, item.qty + 1)}
                >
                  +
                </button>
                <button className="link-btn" onClick={() => remove(item.slug, item.size, item.color)}>
                  {t.remove}
                </button>
              </div>
            </div>
            <div>{formatPrice(currentPrice(product!) * item.qty, locale)}</div>
          </div>
        );
      })}

      <div className="cart-summary">
        <div className="field">
          <label htmlFor="ship-country">{t.shipTo}</label>
          <select id="ship-country" value={country} onChange={(e) => chooseCountry(e.target.value)}>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {zone && (
            <small className="note">
              {showCarrier && `${t.carrier}: DHL Express · `}{t.delivery}: {zone.delivery[locale]}
              {zone.freeFrom !== undefined && ` · ${t.freeFrom} ${formatPrice(zone.freeFrom, locale)}`}
            </small>
          )}
        </div>

        <div className="sum-row">
          <span>{t.subtotal}</span>
          <span>{formatPrice(subtotal, locale)}</span>
        </div>
        <div className="sum-row">
          <span>{t.shipping}</span>
          <span>{ship === 0 ? t.shippingFree : formatPrice(ship, locale)}</span>
        </div>
        <div className="cart-total">
          <span>{t.total}</span>
          <strong>{formatPrice(subtotal + ship, locale)}</strong>
        </div>
        <p className="note">{vatNote}</p>
        <p className="note">{packagingNote}</p>

        <label className="check">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>
            {t.terms}{' '}
            <span className="note">
              (<Link href={`/${locale}/info/terms`}>{t.termsLinks.split(' · ')[0]}</Link> ·{' '}
              <Link href={`/${locale}/info/returns`}>{t.termsLinks.split(' · ')[1]}</Link> ·{' '}
              <Link href={`/${locale}/info/privacy`}>{t.termsLinks.split(' · ')[2]}</Link>)
            </span>
          </span>
        </label>

        <button className="btn btn-block" onClick={checkout} disabled={busy || !paymentReady}>
          {busy ? t.redirecting : t.checkout}
        </button>
        {!paymentReady && <p className="note">{t.errNotConfigured}</p>}
        {error && (
          <p className="note" role="alert" style={{ color: 'var(--sale)' }}>
            {error}
          </p>
        )}
        <p className="note">{t.checkoutNote}</p>
      </div>
    </>
  );
}
