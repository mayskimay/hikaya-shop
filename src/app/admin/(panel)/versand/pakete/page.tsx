import Link from 'next/link';
import { listOrders, canStoreOrders, type ShippingOrder } from '@/lib/orders';
import { dhlLive } from '@/lib/providers';
import { dhlExpressConfig } from '@/lib/shipping/dhl';
import { getShopConfig, zoneFor, type ShopConfig } from '@/lib/settings';
import { requireAdminPage } from '@/lib/adminPage';
import ShipmentActions from '@/components/admin/ShipmentActions';
import { NeedsSanity, date, eur } from '@/components/admin/ui';

// Pakete versenden: bezahlte Bestellungen, Etiketten, Sendungsnummern
export const dynamic = 'force-dynamic';

function OrderCard({ o, cfg, dhlReady }: { o: ShippingOrder; cfg: ShopConfig; dhlReady: boolean }) {
  const zone = zoneFor(cfg, o.address?.country || o.country);
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
        Summe {eur(o.total)} · Versand {eur(o.shipping)} · {zone ? `${zone.label.de}, ${zone.carrier === 'dhl-express' ? 'DHL Express' : 'Standardversand'}` : o.country}
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
        autoLabel={dhlReady && zone?.carrier === 'dhl-express' && Boolean(zone.dhlProductCode)}
      />
    </div>
  );
}

export default async function PaketePage() {
  await requireAdminPage();
  const cfg = await getShopConfig({ fresh: true });
  const dhl = dhlExpressConfig();
  // Etikett-Knopf nur, wenn DHL-Zugangsdaten da sind (Testumgebung oder live)
  const dhlReady = dhl.ok;
  const storage = canStoreOrders();
  const orders = storage ? await listOrders(['paid', 'awaiting_payment', 'shipped', 'delivered']) : [];
  const toShip = orders.filter((o) => o.status === 'paid');
  const pending = orders.filter((o) => o.status === 'awaiting_payment');
  const shipped = orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').slice(0, 30);
  const card = (o: ShippingOrder) => <OrderCard key={o.orderNumber} o={o} cfg={cfg} dhlReady={dhlReady} />;

  return (
    <>
      <h1>Pakete versenden</h1>
      <p className="admin-lead">
        {dhlReady
          ? dhl.mode === 'test'
            ? 'DHL Express ist im Testmodus verbunden: Test-Etiketten sind nicht gültig und werden nicht an DHL übergeben.'
            : dhlLive(cfg)
              ? 'DHL Express ist live verbunden: Etiketten sind echte, kostenpflichtige Sendungen.'
              : 'DHL Express: Absenderangaben unter Shop-Infos fehlen noch.'
          : 'Kein Versanddienst angebunden: Paket beim Versanddienst deiner Wahl aufgeben, dann hier die Sendungsnummer eintragen – die Kundin bekommt eine E-Mail.'}{' '}
        Einstellungen und Anbieter: <Link href="/admin/versand">Versand</Link>.
      </p>
      {!storage && <NeedsSanity />}

      <h2>Zu versenden ({toShip.length})</h2>
      {toShip.length === 0 && <p className="note">Keine offenen Bestellungen.</p>}
      {toShip.map(card)}

      {pending.length > 0 && (
        <>
          <h2>Zahlung ausstehend ({pending.length})</h2>
          <p className="note">Erst versenden, wenn die Zahlung eingegangen ist (Status wechselt automatisch).</p>
          {pending.map(card)}
        </>
      )}

      <h2>Zuletzt versendet</h2>
      {shipped.length === 0 && <p className="note">Noch nichts versendet.</p>}
      {shipped.map(card)}
    </>
  );
}
