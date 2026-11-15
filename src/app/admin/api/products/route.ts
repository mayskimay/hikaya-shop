import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';
import { canStoreOrders, sanityMutate, sanityQuery } from '@/lib/orders';
import { parseProductPatch } from '@/lib/productPatch';

// Schnelländerung von Preis, Sale-Preis und Bestand (Fotos, Größen, Farben, Texte im Editor).

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const denied = await requireAdmin(req, { write: true });
  if (denied) return denied;
  if (!canStoreOrders()) return Response.json({ error: 'Sanity ist noch nicht eingerichtet.' }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const p = parseProductPatch(body);
  if (!p.ok) return Response.json({ error: p.error }, { status: 400 });
  const exists = await sanityQuery<string | null>(`*[_id == $id && _type == "product"][0]._id`, { id: p.id });
  if (!exists) return Response.json({ error: 'Produkt nicht gefunden (nur veröffentlichte Produkte)' }, { status: 404 });
  try {
    const patch: Record<string, unknown> = { id: p.id, set: p.set };
    if (p.unset.length) patch.unset = p.unset;
    const mutations: unknown[] = [{ patch }];
    // Gibt es einen offenen Entwurf im Editor, dort dieselben Werte setzen
    const draft = await sanityQuery<string | null>(`*[_id == $id][0]._id`, { id: `drafts.${p.id}` });
    if (draft) mutations.push({ patch: { ...patch, id: draft } });
    await sanityMutate(mutations);
  } catch (error) {
    console.error('[Produkte]', error);
    return Response.json({ error: 'Speichern fehlgeschlagen' }, { status: 502 });
  }
  revalidatePath('/', 'layout');
  return Response.json({ ok: true });
}
