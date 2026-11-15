import { requireAdminPage } from '@/lib/adminPage';
import { companyProblems, getShopConfig } from '@/lib/settings';
import { canStoreOrders } from '@/lib/orders';
import ShopInfoForm from '@/components/admin/ShopInfoForm';
import { NeedsSanity } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function ShopInfoPage() {
  await requireAdminPage();
  const cfg = await getShopConfig({ fresh: true });
  const missing = companyProblems(cfg.company);
  return (
    <>
      <h1>Shop-Informationen</h1>
      <p className="admin-lead">
        Diese Angaben erscheinen im Impressum, in Bestell-E-Mails und als Absender auf Versandetiketten. Trage nur echte
        Angaben ein – die rechtlichen Texte und Pflichtangaben bitte vor dem Start prüfen lassen.
      </p>
      {!canStoreOrders() && <NeedsSanity />}
      {missing.length > 0 && <p className="admin-msg warn">Für das Impressum fehlen noch: {missing.join(', ')}.</p>}
      <ShopInfoForm company={cfg.company} contact={cfg.contact} vatNote={cfg.vatNote} packagingNote={cfg.packagingNote} canSave={canStoreOrders()} />
    </>
  );
}
