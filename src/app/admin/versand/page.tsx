import type { ReactNode } from 'react';
import { listOrders, canStoreOrders, type ShippingOrder } from '@/lib/orders';
import { dhlExpressConfig, senderProblems } from '@/lib/shipping/dhl';
import { emailConfigured } from '@/lib/email';
import { zoneForCountry } from '@/lib/shop';
import ShipmentActions from '@/components/admin/ShipmentActions';

// Versand-Seite für die Inhaberin (passwortgeschützt über die Middleware)
export const dynamic = 'force-dynamic';

const eur = (v: number) => new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(v);
const date = (s?: string) => (s ? new Date(s).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' }) : '');

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li style={{ color: ok ? 'inherit' : 'var(--sale)' }}>
      {ok ? '✓' : '✗'} {children}
    </li>
  );
}

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
  const dhl = dhlExpressConfig();
  const sender = senderProblems();
  const storage = canStoreOrders();
  const orders = storage ? await listOrders(['paid', 'awaiting_payment', 'shipped', 'delivered']) : [];
  const toShip = orders.filter((o) => o.status === 'paid');
  const pending = orders.filter((o) => o.status === 'awaiting_payment');
  const shipped = orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').slice(0, 30);

  return (
    <div className="container section" style={{ maxWidth: 900 }}>
      <h1>Versand</h1>

      <div className="admin-card">
        <strong>Einrichtung</strong>
        <ul className="admin-checks">
          <Check ok={storage}>Bestellungen werden gespeichert (Sanity-Token)</Check>
          <Check ok={dhl.ok}>
            DHL Express verbunden {dhl.ok ? `(Modus: ${dhl.mode === 'test' ? 'TEST – Etiketten sind nicht gültig' : 'LIVE'})` : `– ${dhl.reason}`}
          </Check>
          <Check ok={sender.length === 0}>
            Absenderadresse vollständig {sender.length ? `– fehlt: ${sender.join(', ')}` : ''}
          </Check>
          <Check ok={Boolean(process.env.DHL_TRACKING_API_KEY)}>DHL-Sendungsverfolgung (Status-Abfrage)</Check>
          <Check ok={emailConfigured()}>Versand-E-Mails an Kundinnen</Check>
        </ul>
        <small className="note">
          Ohne DHL-Zugang kannst du Etiketten im DHL-Portal erstellen und die Sendungsnummer hier eintragen –
          die Kundin bekommt dann trotzdem die Versand-E-Mail mit Sendungsverfolgung.
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
