import { isAdminAuthorized } from '@/lib/adminAuth';
import { getLabelPdf } from '@/lib/orders';

// Liefert das gespeicherte DHL-Etikett als PDF (nur mit Passwort)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!isAdminAuthorized(req.headers.get('authorization'))) return new Response('Nicht angemeldet', { status: 401 });
  const order = new URL(req.url).searchParams.get('order') ?? '';
  if (!/^HK-\d{8}-[A-Z0-9]{6}$/.test(order)) return new Response('Ungültige Bestellnummer', { status: 400 });
  const b64 = await getLabelPdf(order);
  if (!b64) return new Response('Kein Etikett vorhanden', { status: 404 });
  return new Response(Buffer.from(b64, 'base64'), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="DHL-Etikett-${order}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
