import { NextResponse } from 'next/server';
import { listOrders, updateTracking } from '@/lib/orders';
import { fetchDhlTracking } from '@/lib/shipping/dhl';

// Fragt einmal täglich den DHL-Status versendeter Bestellungen ab (Vercel Cron, siehe vercel.json).
// Geschützt über CRON_SECRET: Vercel schickt "Authorization: Bearer <CRON_SECRET>" automatisch mit.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!process.env.DHL_TRACKING_API_KEY) return NextResponse.json({ skipped: 'DHL_TRACKING_API_KEY fehlt' });

  const orders = (await listOrders(['shipped'], 100)).filter(
    (o) => o.trackingNumber && (o.carrier ?? '').toUpperCase().includes('DHL') && o.labelCreatedInMode !== 'test'
  ).slice(0, 9); // max. ~9 pro Lauf, damit die Funktion unter 60 Sekunden bleibt
  let updated = 0;
  for (const o of orders) {
    const t = await fetchDhlTracking(o.trackingNumber!);
    if (t.ok) {
      await updateTracking(o.orderNumber, t.state, t.description);
      updated++;
    }
    await new Promise((r) => setTimeout(r, 5500)); // DHL-Grenze: max. 1 Abfrage / 5 Sekunden
  }
  return NextResponse.json({ checked: orders.length, updated });
}
