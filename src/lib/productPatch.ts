// Prüft eine Schnelländerung aus /admin → Produkte (Preis, Sale-Preis, Bestand)

export function parseProductPatch(body: Record<string, unknown>):
  | { ok: true; id: string; set: Record<string, number>; unset: string[] }
  | { ok: false; error: string } {
  const id = typeof body.id === 'string' ? body.id : '';
  if (!/^[A-Za-z0-9_-][A-Za-z0-9._-]{0,120}$/.test(id) || id.startsWith('drafts.')) return { ok: false, error: 'Ungültiges Produkt' };
  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0 || price > 100000) return { ok: false, error: 'Preis ist ungültig' };
  const stock = Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) return { ok: false, error: 'Bestand muss eine ganze Zahl ab 0 sein' };
  const set: Record<string, number> = { price: Math.round(price * 100) / 100, stock };
  const unset: string[] = [];
  if (body.salePrice === '' || body.salePrice === null || body.salePrice === undefined) unset.push('salePrice');
  else {
    const sale = Number(body.salePrice);
    if (!Number.isFinite(sale) || sale <= 0) return { ok: false, error: 'Sale-Preis ist ungültig' };
    if (sale >= set.price) return { ok: false, error: 'Der Sale-Preis muss niedriger als der Preis sein' };
    set.salePrice = Math.round(sale * 100) / 100;
  }
  return { ok: true, id, set, unset };
}
