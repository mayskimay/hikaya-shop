import { requireAdmin } from '@/lib/adminAuth';
import { checkDhlExpressConnection, checkDhlTrackingKey } from '@/lib/shipping/dhl';
import { checkStripeAccount } from '@/lib/providers';

// „Verbindung prüfen“: testet Zugangsdaten beim Anbieter, ohne Zahlungen oder Sendungen auszulösen.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const denied = await requireAdmin(req, { write: true });
  if (denied) return denied;
  const { provider } = (await req.json().catch(() => ({}))) as { provider?: string };
  if (provider === 'dhl-express') return Response.json(await checkDhlExpressConnection());
  if (provider === 'dhl-tracking') return Response.json(await checkDhlTrackingKey());
  if (provider === 'stripe') {
    const a = await checkStripeAccount();
    if (!a) return Response.json({ ok: false, message: 'Kein Stripe-Schlüssel eingetragen.' });
    if (!a.reachable) return Response.json({ ok: false, message: `Verbindung fehlgeschlagen: ${a.error ?? ''}` });
    return Response.json({
      ok: true,
      message: `Verbunden${a.displayName ? ` mit „${a.displayName}“` : ''}. Zahlungen annehmen: ${a.chargesEnabled ? 'ja' : 'nein'} · Auszahlungen aufs Bankkonto: ${a.payoutsEnabled ? 'ja' : 'nein'}.`,
    });
  }
  return Response.json({ ok: false, message: 'Unbekannter Anbieter' }, { status: 400 });
}
