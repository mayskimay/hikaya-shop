import { requireAdminPage } from '@/lib/adminPage';
import { adminCategories, studioCreate, studioEdit, studioReady } from '@/lib/adminData';
import { NeedsSanity } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await requireAdminPage();
  const { editable, categories } = await adminCategories();
  const tops = categories.filter((c) => !c.parent);
  return (
    <>
      <h1>Kategorien</h1>
      <p className="admin-lead">
        Hauptkategorien und Unterkategorien mit deutschem und englischem Namen. Eine Unterkategorie legst du an, indem du im
        Editor bei „Übergeordnete Kategorie“ die Hauptkategorie auswählst. Die Reihenfolge bestimmt das Feld „Reihenfolge“
        (kleine Zahl = weiter vorne).
      </p>
      {!editable && <NeedsSanity />}
      {studioReady && (
        <p>
          <a className="btn" href={studioCreate('category')} target="_blank" rel="noopener">
            + Neue Kategorie / Unterkategorie
          </a>
        </p>
      )}
      <div className="admin-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name (DE / EN)</th>
              <th>Produkte</th>
              <th>Reihenfolge</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tops.map((t) => [
              <tr key={t._id}>
                <td>
                  <strong>{t.title}</strong> <small className="note">/ {t.titleEn || '– EN fehlt'}</small>
                </td>
                <td>{editable ? t.count : '–'}</td>
                <td>{t.order}</td>
                <td>{studioReady && editable && <a href={studioEdit(t._id, 'category')} target="_blank" rel="noopener">Bearbeiten ↗</a>}</td>
              </tr>,
              ...categories
                .filter((c) => c.parent === t._id)
                .map((c) => (
                  <tr key={c._id}>
                    <td style={{ paddingLeft: 28 }}>
                      › {c.title} <small className="note">/ {c.titleEn || '– EN fehlt'}</small>
                    </td>
                    <td>{editable ? c.count : '–'}</td>
                    <td>{c.order}</td>
                    <td>{studioReady && editable && <a href={studioEdit(c._id, 'category')} target="_blank" rel="noopener">Bearbeiten ↗</a>}</td>
                  </tr>
                )),
            ])}
          </tbody>
        </table>
      </div>
    </>
  );
}
