import Link from 'next/link';
import { requireAdminPage } from '@/lib/adminPage';
import { listAllOrders, canStoreOrders, MANUAL_TRANSITIONS } from '@/lib/orders';
import { ORDER_STATUS_LABEL, ORDER_STATUS_ORDER } from '@/lib/orderStatus';
import OrderStatusControl from '@/components/admin/OrderStatusControl';
import { NeedsSanity, date, eur } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const all = canStoreOrders() ? await listAllOrders(500) : [];
  const q = (sp.q ?? '').trim().toLowerCase();
  const orders = all.filter(
    (o) =>
      (!sp.status || o.status === sp.status) &&
      (!q || [o.orderNumber, o.email, o.customerName, o.shippingName].some((v) => v?.toLowerCase().includes(q)))
  );
  const count = (s: string) => all.filter((o) => o.status === s).length;

  return (
    <>
      <h1>Bestellungen</h1>
      <p className="admin-lead">
        Den Zahlungsstatus setzt Stripe automatisch (bezahlt, fehlgeschlagen, erstattet). Von Hand kannst du stornieren und
        „zugestellt“ setzen. Versenden geht unter <Link href="/admin/versand/pakete">Pakete versenden</Link>. Erstattungen
        machst du im Stripe-Dashboard – der Status wird dann automatisch angepasst.
      </p>
      {!canStoreOrders() && <NeedsSanity />}

      <div className="admin-filter">
        <Link href="/admin/bestellungen" aria-current={!sp.status ? 'true' : undefined}>
          Alle ({all.length})
        </Link>
        {ORDER_STATUS_ORDER.filter((s) => count(s) > 0).map((s) => (
          <Link key={s} href={`/admin/bestellungen?status=${s}`} aria-current={sp.status === s ? 'true' : undefined}>
            {ORDER_STATUS_LABEL[s]} ({count(s)})
          </Link>
        ))}
      </div>
      <form className="admin-form" style={{ maxWidth: 420, marginBottom: 14 }}>
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <label>
          Suche (Bestellnummer, Name, E-Mail)
          <input name="q" defaultValue={sp.q ?? ''} />
        </label>
      </form>

      {orders.length === 0 && <p className="note">Keine Bestellungen gefunden.</p>}
      {orders.map((o) => (
        <div className="admin-card" key={o.orderNumber}>
          <div className="admin-card-head">
            <strong>
              {o.testMode && <span className="admin-tag">TEST</span>}
              {o.orderNumber}
            </strong>
            <span>
              <span className="admin-tag">{ORDER_STATUS_LABEL[o.status] ?? o.status}</span> {date(o.createdAt)}
            </span>
          </div>
          <p style={{ margin: '8px 0', whiteSpace: 'pre-line' }}>
            <strong>{o.shippingName || o.customerName}</strong>
            {'\n'}
            {o.shippingAddress}
          </p>
          <small className="note">
            {o.email}
            {o.phone ? ` · ${o.phone}` : ''} · Zahlart: {o.paymentMethod || '–'}
          </small>
          <ul className="admin-items">
            {o.items?.map((it, i) => (
              <li key={i}>
                {it.quantity}× {it.name} – {it.size} · {it.color} ({eur(it.lineTotal)})
              </li>
            ))}
          </ul>
          <small className="note">
            Summe {eur(o.total)} (Versand {eur(o.shipping)})
            {o.refundedAmount ? ` · erstattet ${eur(o.refundedAmount)}` : ''}
            {o.trackingNumber ? ` · ${o.carrier ?? ''} ${o.trackingNumber}` : ''}
            {o.stockRestored ? ' · Bestand zurückgebucht' : ''}
          </small>
          {o.stripePaymentIntent && (
            <div className="admin-links">
              <a href={`https://dashboard.stripe.com/${o.testMode ? 'test/' : ''}payments/${encodeURIComponent(o.stripePaymentIntent)}`} target="_blank" rel="noopener noreferrer">
                Zahlung bei Stripe öffnen (Erstattung) ↗
              </a>
            </div>
          )}
          <OrderStatusControl orderNumber={o.orderNumber} status={o.status} options={MANUAL_TRANSITIONS[o.status] ?? []} />
        </div>
      ))}
    </>
  );
}
