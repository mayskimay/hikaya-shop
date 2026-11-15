import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/adminAuth';
import { canStoreOrders, sanityMutate } from '@/lib/orders';
import { shippingSettingsInput, shopSettingsInput, siteTextsInput } from '@/lib/settingsInput';

// Speichert Shop-Infos, Versand-Einstellungen und Texte (nur angemeldet, nur von dieser Seite).
// Gespeichert wird in Sanity. Geheimnisse (Schlüssel, Passwörter, Bankdaten) werden hier nie angenommen.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HANDLERS = { shop: shopSettingsInput, shipping: shippingSettingsInput, texts: siteTextsInput } as const;

export async function POST(req: Request) {
  const denied = await requireAdmin(req, { write: true });
  if (denied) return denied;
  if (!canStoreOrders()) {
    return Response.json({ error: 'Speichern ist erst möglich, wenn Sanity eingerichtet ist (Project ID und SANITY_API_WRITE_TOKEN).' }, { status: 503 });
  }
  let body: { type?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }
  const handler = HANDLERS[body.type as keyof typeof HANDLERS];
  if (!handler) return Response.json({ error: 'Unbekannter Bereich' }, { status: 400 });
  const result = handler(body.data);
  if (!result.ok || !result.doc) return Response.json({ error: 'Bitte korrigieren:', errors: result.errors }, { status: 422 });
  try {
    const id = String(result.doc._id);
    // Entwurf aus dem Editor entfernen, damit die hier gespeicherte Fassung gilt
    await sanityMutate([{ createOrReplace: result.doc }, { delete: { id: `drafts.${id}` } }]);
  } catch (error) {
    console.error('[Einstellungen]', error);
    return Response.json({ error: 'Speichern fehlgeschlagen – siehe Server-Protokoll.' }, { status: 502 });
  }
  revalidatePath('/', 'layout');
  return Response.json({ ok: true });
}
