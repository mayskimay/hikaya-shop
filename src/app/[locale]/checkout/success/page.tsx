import Link from 'next/link';
import { getDict } from '@/lib/dict';
import { isLocale, defaultLocale, formatPrice } from '@/lib/i18n';
import { getSession, buildOrder } from '@/lib/fulfillment';
import ClearCart from '@/components/ClearCart';

export const dynamic = 'force-dynamic';

// Danke-Seite nach der Zahlung. Die Angaben werden direkt bei Stripe abgefragt.
// Die Bestellung selbst wird über den Webhook gespeichert (nicht hier).

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale: raw } = await params;
  const { session_id } = await searchParams;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale).checkout;

  const session = session_id ? await getSession(session_id) : null;

  if (!session || session.status !== 'complete') {
    return (
      <div className="section container" style={{ maxWidth: 620, textAlign: 'center' }}>
        <h1>{t.invalidTitle}</h1>
        <p>{t.invalidText}</p>
        <Link href={`/${locale}/shop`} className="btn btn-outline">
          {t.back}
        </Link>
      </div>
    );
  }

  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
  const order = await buildOrder(session, paid ? 'paid' : 'awaiting_payment');

  return (
    <div className="section container" style={{ maxWidth: 620 }}>
      <ClearCart />
      <div style={{ textAlign: 'center' }}>
        <h1>{paid ? t.successTitle : t.pendingTitle}</h1>
        <p>{paid ? t.successText : t.pendingText}</p>
        {order.testMode && <p className="notice">{t.testOrder}</p>}
        <p>
          {t.orderNumber}: <strong>{order.orderNumber}</strong>
        </p>
        {order.email && (
          <p className="note">
            {t.emailNote} {order.email}
          </p>
        )}
      </div>

      <div className="cart-summary" style={{ marginTop: 28 }}>
        {order.items.map((it, i) => (
          <div className="cart-row" key={i}>
            <div>
              <strong>{it.name}</strong>
              <small>
                {it.size} · {it.color} · ×{it.quantity}
              </small>
            </div>
            <div>{formatPrice(it.lineTotal, locale)}</div>
          </div>
        ))}
        <div className="sum-row">
          <span>{getDict(locale).cart.shipping}</span>
          <span>{formatPrice(order.shipping, locale)}</span>
        </div>
        <div className="cart-total">
          <span>{getDict(locale).cart.total}</span>
          <strong>{formatPrice(order.total, locale)}</strong>
        </div>
        {order.shippingAddress && (
          <p className="note" style={{ whiteSpace: 'pre-line' }}>
            <strong>{t.deliverTo}</strong>
            {'\n'}
            {order.shippingName}
            {'\n'}
            {order.shippingAddress}
          </p>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <Link href={`/${locale}/shop`} className="btn btn-outline">
          {t.back}
        </Link>
      </div>
    </div>
  );
}
