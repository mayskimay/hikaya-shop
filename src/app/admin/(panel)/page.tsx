import Link from 'next/link';
import { requireAdminPage } from '@/lib/adminPage';
import { getShopConfig, companyProblems } from '@/lib/settings';
import { activePaymentMethods, checkStripeAccount, infrastructureProviders, paypalProvider, shippingProviders, stripeProvider } from '@/lib/providers';
import { listAllOrders, canStoreOrders } from '@/lib/orders';
import { adminProducts } from '@/lib/adminData';
import { ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import { StateBadge, eur } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  await requireAdminPage();
  const [cfg, account, pm, orders, prod] = await Promise.all([
    getShopConfig({ fresh: true }),
    checkStripeAccount(),
    activePaymentMethods(),
    listAllOrders(300).catch(() => []),
    adminProducts().catch(() => ({ editable: false, products: [] })),
  ]);
  const providers = [stripeProvider(account), paypalProvider(pm), ...shippingProviders(cfg).slice(0, 2), ...infrastructureProviders()];
  const todo = providers.filter((p) => p.state !== 'live');
  const live = orders.filter((o) => !o.testMode);
  const toShip = orders.filter((o) => o.status === 'paid').length;
  const lowStock = prod.products.filter((p) => p.stock > 0 && p.stock <= 2).length;
  const soldOut = prod.products.filter((p) => p.stock <= 0).length;
  const missing = companyProblems(cfg.company);
  const revenue = live.filter((o) => ['paid', 'shipped', 'delivered'].includes(o.status)).reduce((s, o) => s + o.total, 0);

  return (
    <>
      <h1>Übersicht</h1>
      <p className="admin-lead">
        Hier verwaltest du den Shop. Alles, was du in diesem Bereich speicherst, erscheint nach spätestens einer Minute im Shop.
        Zahlungen und Versand gelten erst als „aktiv“, wenn sie mit deinen echten Anbieterkonten verbunden und geprüft sind.
      </p>

      <div className="admin-tiles">
        <Link className="admin-tile" href="/admin/versand/pakete">
          <strong>Zu versenden</strong>
          <span className="big">{toShip}</span>
          <p>bezahlte Bestellungen warten auf den Versand</p>
        </Link>
        <Link className="admin-tile" href="/admin/bestellungen">
          <strong>Bestellungen</strong>
          <span className="big">{orders.length}</span>
          <p>{canStoreOrders() ? `davon ${orders.length - live.length} Test · Umsatz (echt): ${eur(revenue)}` : 'werden erst mit Sanity gespeichert'}</p>
        </Link>
        <Link className="admin-tile" href="/admin/produkte">
          <strong>Produkte</strong>
          <span className="big">{prod.products.length}</span>
          <p>
            {soldOut} ausverkauft · {lowStock} fast ausverkauft (≤ 2)
            {!prod.editable && ' · Beispieldaten'}
          </p>
        </Link>
        <Link className="admin-tile" href="/admin/shop-infos">
          <strong>Shop-Infos</strong>
          <p>{missing.length ? `Fehlt fürs Impressum: ${missing.join(', ')}` : 'Pflichtangaben eingetragen (rechtlich prüfen lassen)'}</p>
        </Link>
        <Link className="admin-tile" href="/admin/versand">
          <strong>Versand</strong>
          <p>{cfg.zones.length} Versandzonen · {cfg.fromCms.shipping ? 'eigene Einstellungen' : 'Startwerte (noch nicht gespeichert)'}</p>
        </Link>
        <Link className="admin-tile" href="/admin/zahlungen">
          <strong>Zahlungsarten aktiv</strong>
          <p>{pm.methods.length ? `${pm.methods.map((m) => m.name.de).join(', ')}${pm.state === 'test' ? ' (Testmodus)' : ''}` : 'noch keine'}</p>
        </Link>
      </div>

      <h2>Status der Anbieter</h2>
      <div className="admin-scroll">
        <table className="admin-table">
          <tbody>
            {providers.map((p) => (
              <tr key={p.id}>
                <td className="admin-badgecell">
                  <StateBadge state={p.state} />
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
      </div>
      {todo.length > 0 && (
        <p className="note">
          {todo.length} Bereiche brauchen noch deine Einrichtung – Details und Schritte unter <Link href="/admin/zahlungen">Zahlungen</Link> und{' '}
          <Link href="/admin/versand">Versand</Link>.
        </p>
      )}

      {orders.length > 0 && (
        <>
          <h2>Neueste Bestellungen</h2>
          <div className="admin-scroll">
            <table className="admin-table">
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.orderNumber}>
                    <td>
                      {o.testMode && <span className="admin-tag">TEST</span>}
                      {o.orderNumber}
                    </td>
                    <td>{o.shippingName || o.customerName}</td>
                    <td>{ORDER_STATUS_LABEL[o.status] ?? o.status}</td>
                    <td>{eur(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
