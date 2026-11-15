import Link from 'next/link';
import { requireAdminPage } from '@/lib/adminPage';
import { getShopConfig } from '@/lib/settings';
import { canStoreOrders } from '@/lib/orders';
import { dhlLive, shippingProviders } from '@/lib/providers';
import ShippingForm from '@/components/admin/ShippingForm';
import { NeedsSanity, ProviderCard } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function ShippingPage() {
  await requireAdminPage();
  const cfg = await getShopConfig({ fresh: true });
  const providers = shippingProviders(cfg);
  const [express, tracking, ...others] = providers;

  return (
    <>
      <h1>Versand</h1>
      <p className="admin-lead">
        Versandzonen, Kosten und Lieferzeiten gelten sofort im Warenkorb und an der Kasse. Kosten und Lieferzeiten sind deine
        eigenen Angaben – es werden keine Anbieterpreise abgerufen. Pakete versendest du unter{' '}
        <Link href="/admin/versand/pakete">Pakete versenden</Link>.
      </p>
      {!canStoreOrders() && <NeedsSanity />}
      {!cfg.fromCms.shipping && canStoreOrders() && (
        <p className="admin-msg warn">Es gelten noch die Startwerte (Platzhalter). Bitte prüfen, anpassen und speichern.</p>
      )}

      <h2>Versandarten und Kosten</h2>
      <ShippingForm zones={cfg.zones} parcel={cfg.parcel} canSave={canStoreOrders()} dhlConnected={dhlLive(cfg)} />

      <h2>Lieferdienste</h2>
      <p className="note">
        „Aktiv“ heißt: mit deinem echten Geschäftskonto verbunden und geprüft. „Verbindung prüfen“ testet nur die Zugangsdaten –
        es wird keine Sendung erstellt.
      </p>
      <ProviderCard p={express} check={express.state === 'not_connected' ? undefined : 'dhl-express'} />
      <ProviderCard p={tracking} check={tracking.state === 'not_connected' ? undefined : 'dhl-tracking'} />
      <h3>Weitere Lieferdienste (nicht angebunden)</h3>
      {others.map((p) => (
        <ProviderCard key={p.id} p={p} />
      ))}
    </>
  );
}
