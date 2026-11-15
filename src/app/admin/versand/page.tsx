import type { ReactNode } from 'react';
import { listOrders, canStoreOrders, type ShippingOrder } from '@/lib/orders';
import { providerStatus, activePaymentMethods, type ProviderState } from '@/lib/providers';
import { zoneForCountry } from '@/lib/shop';
import ShipmentActions from '@/components/admin/ShipmentActions';

// Versand-Seite für die Inhaberin (passwortgeschützt über die Middleware)
export const dynamic = 'force-dynamic';

const eur = (v: number) => new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(v);
const date = (s?: string) => (s ? new Date(s).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' }) : '');

const STATE_LABEL: Record<ProviderState, string> = {
  live: 'aktiv',
  test: 'Testmodus',
  missing: 'fehlt',
  blocked: 'gesperrt',
};

function OrderCard({ o }: { o: ShippingOrder }) {
  const zone = zoneForCountry(o.address?.country || o.country);
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <strong>
          {o.testMode && <span className="admin-tag">TEST</span>} {o.orderNumber}
        </strong>
        <span>{date(o.createdAt)}</span>
      </div>
      <p style={{ whiteSpace: 'pre-line', margin: '8px 0' }}>
        <strong>{o.shippingName || o.customerName}</strong>
        {'\n'}
        {o.shippingAddress}
      </p>
      <small className="note">
        {o.email}
        {o.phone ? ` · ${o.phone}` : ''}
      </small>
      <ul className="admin-items">
        {o.items.map((it, i) => (
          <li key={i}>
            {it.quantity}× {it.name} – {it.size} · {it.color}
          </li>
        ))}
      </ul>
      <small className="note">
        Summe {eur(o.total)} · Versand {eur(o.shipping)} · {zone ? `${zone.label.de}, ${zone.carrier}` : o.country}
      </small>
      {o.trackingNumber && (
        <p style={{ margin: '10px 0 0' }}>
          Sendungsnummer: <strong>{o.trackingNumber}</strong>
          {o.labelCreatedInMode === 'test' && <span className="admin-tag warn">Test-Etikett – nicht gültig</span>}
          {o.trackingUrl && (
            <>
              {' '}
              · <a href={o.trackingUrl} target="_blank" rel="noopener">Verfolgen</a>
            </>
          )}
          {o.trackingDescription && (
            <>
              <br />
              <small className="note">
                DHL: {o.trackingDescription} ({date(o.trackingUpdatedAt)})
              </small>
            </>
          )}
        </p>
      )}
      <ShipmentActions
        orderNumber={o.orderNumber}
        status={o.status}
        hasLabel={Boolean(o.hasLabel)}
        trackingNumber={o.trackingNumber ?? ''}
        autoLabel={Boolean(zone?.dhlProductCode)}
      />
    </div>
  );
}

export default async function VersandPage() {
  const status = providerStatus();
  const payments = await activePaymentMethods();
  const storage = canStoreOrders();
  const orders = storage ? await listOrders(['paid', 'awaiting_payment', 'shipped', 'delivered']) : [];
  const toShip = orders.filter((o) => o.status === 'paid');
  const pending = orders.filter((o) => o.status === 'awaiting_payment');
  const shipped = orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').slice(0, 30);

  return (
    <div className="container section" style={{ maxWidth: 900 }}>
      <h1>Versand</h1>

      <div className="admin-card">
        <strong>Anbieter-Status</strong>
        <table className="admin-status">
          <tbody>
            {status.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className={`admin-state ${p.state}`}>{STATE_LABEL[p.state]}</span>
                </td>
                <td>
                  <strong>{p.name}</strong>
                  <br />
                  <small className="note">{p.detail}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: '12px 0 4px' }}>
          <strong>Zahlungsarten im Stripe-Konto aktiv:</strong>{' '}
          {payments.methods.length ? payments.methods.map((m) => m.name.de).join(', ') : '– (noch keine oder Stripe nicht verbunden)'}
        </p>
        <small className="note">
          Kundinnen sehen nur, was hier aktiv ist: Zahlungsarten zeigt Stripe auf der Zahlungsseite, „DHL Express“
          erscheint im Checkout erst im Live-Modus. Ohne DHL-Zugang kannst du die Sendungsnummer unten von Hand eintragen.
        </small>
      </div>

      <h2>Zu versenden ({toShip.length})</h2>
      {toShip.length === 0 && <p className="note">Keine offenen Bestellungen.</p>}
      {toShip.map((o) => (
        <OrderCard key={o.orderNumber} o={o} />
      ))}

      {pending.length > 0 && (
        <>
          <h2>Zahlung ausstehend ({pending.length})</h2>
          <p className="note">Diese Bestellungen erst versenden, wenn die Zahlung eingegangen ist (Status wechselt automatisch).</p>
          {pending.map((o) => (
            <OrderCard key={o.orderNumber} o={o} />
          ))}
        </>
      )}

      <h2>Zuletzt versendet</h2>
      {shipped.length === 0 && <p className="note">Noch nichts versendet.</p>}
      {shipped.map((o) => (
        <OrderCard key={o.orderNumber} o={o} />
      ))}
    </div>
  );
}
