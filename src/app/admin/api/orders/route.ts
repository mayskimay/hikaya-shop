import { requireAdmin } from '@/lib/adminAuth';
import { changeStatusManually, type OrderStatus } from '@/lib/orders';

// Status einer Bestellung von Hand ändern (nur erlaubte Schritte, z. B. stornieren, zugestellt).

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const denied = await requireAdmin(req, { write: true });
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { orderNumber?: string; status?: string };
  const orderNumber = String(body.orderNumber ?? '');
  if (!/^HK-\d{8}-[A-Z0-9]{6}$/.test(orderNumber)) return Response.json({ error: 'Ungültige Bestellnummer' }, { status: 400 });
  try {
    const r = await changeStatusManually(orderNumber, String(body.status ?? '') as OrderStatus);
    if (!r.ok) return Response.json({ error: r.error }, { status: 409 });
    return Response.json({ ok: true, restocked: r.restocked });
  } catch (error) {
    console.error('[Bestellungen]', error);
    return Response.json({ error: 'Speichern fehlgeschlagen' }, { status: 502 });
  }
}
