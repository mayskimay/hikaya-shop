import { requireAdminPage } from '@/lib/adminPage';
import { TEXT_FIELDS, dictValue, getShopConfig } from '@/lib/settings';
import { getDict } from '@/lib/dict';
import { canStoreOrders } from '@/lib/orders';
import TextsForm, { type TextRow } from '@/components/admin/TextsForm';
import { NeedsSanity } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function TextsPage() {
  await requireAdminPage();
  const cfg = await getShopConfig({ fresh: true });
  const de = getDict('de');
  const en = getDict('en');
  const rows: TextRow[] = TEXT_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    long: f.long,
    legal: f.legal,
    value: cfg.texts[f.key] ?? { de: '', en: '' },
    fallback: { de: dictValue(de, f.path), en: dictValue(en, f.path) },
  }));
  return (
    <>
      <h1>Texte (Deutsch / Englisch)</h1>
      <p className="admin-lead">
        Hier änderst du die wichtigsten Texte der Startseite und der Info-Seiten in beiden Sprachen. Produkt- und
        Kategorienamen pflegst du direkt beim Produkt bzw. bei der Kategorie. AGB, Datenschutz und Widerrufsbelehrung müssen
        rechtssicher erstellt werden – sie werden hier nicht automatisch erzeugt.
      </p>
      {!canStoreOrders() && <NeedsSanity />}
      <TextsForm rows={rows} canSave={canStoreOrders()} />
    </>
  );
}
