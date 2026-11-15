import { requireAdminPage } from '@/lib/adminPage';
import { adminProducts, studioCreate, studioEdit, studioReady } from '@/lib/adminData';
import ProductRow from '@/components/admin/ProductRow';
import { NeedsSanity } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  await requireAdminPage();
  const { editable, products } = await adminProducts();
  return (
    <>
      <h1>Produkte</h1>
      <p className="admin-lead">
        Preise, Sale-Preise und Bestände kannst du direkt hier ändern. Fotos, Größen, Farben, Beschreibungen (DE/EN) und
        Kategorie bearbeitest du im Editor – der Knopf „Bearbeiten“ öffnet das Produkt dort.
      </p>
      {!editable && <NeedsSanity />}
      {studioReady && (
        <p>
          <a className="btn" href={studioCreate('product')} target="_blank" rel="noopener">
            + Neues Produkt anlegen
          </a>
        </p>
      )}
      <div className="admin-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>Produkt</th>
              <th>Größen / Farben</th>
              <th>Preis €</th>
              <th>Sale €</th>
              <th>Bestand</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.image ? <img src={p.image} alt="" /> : <span className="admin-tag warn">kein Foto</span>}</td>
                <td>
                  <strong>{p.name}</strong>
                  {p.hasDraft && <span className="admin-tag">Entwurf offen</span>}
                  <br />
                  <small className="note">
                    {p.category}
                    {p.sub ? ` › ${p.sub}` : ''} · {p.imageCount} Fotos
                  </small>
                  {studioReady && editable && (
                    <>
                      <br />
                      <a href={studioEdit(p._id, 'product')} target="_blank" rel="noopener">
                        Bearbeiten (Fotos, Größen, Farben, Texte) ↗
                      </a>
                    </>
                  )}
                </td>
                <td>
                  <small>
                    {p.sizes.join(', ') || '–'}
                    <br />
                    {p.colors.join(', ') || '–'}
                  </small>
                </td>
                <ProductRow id={p._id} editable={editable} price={p.price} salePrice={p.salePrice} stock={p.stock} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {products.length === 0 && <p className="note">Noch keine Produkte angelegt.</p>}
    </>
  );
}
