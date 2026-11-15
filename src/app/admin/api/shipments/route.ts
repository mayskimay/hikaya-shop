import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getOrder, saveLabel, markShipped, updateTracking } from '@/lib/orders';
import { createDhlExpressLabel, dhlTrackingUrl, fetchDhlTracking } from '@/lib/shipping/dhl';
import { sendShippingConfirmation } from '@/lib/email';
import { getProducts } from '@/lib/data';
import { getShopConfig, zoneFor } from '@/lib/settings';

// Aktionen beim Paketversand. Zusätzlich zur Middleware wird hier die Anmeldung erneut geprüft.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TRACKING_RE = /^[A-Za-z0-9-]{6,40}$/;

export async function POST(req: Request) {
  const denied = await requireAdmin(req, { write: true });
  if (denied) return denied;
  let body: { action?: string; orderNumber?: string; trackingNumber?: string; carrier?: string; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }
  const order = body.orderNumber ? await getOrder(body.orderNumber) : null;
  if (!order) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 });

  try {
    if (body.action === 'create-label') {
      if (order.status !== 'paid') {
        return NextResponse.json({ error: 'Etiketten nur für bezahlte, noch nicht versendete Bestellungen.' }, { status: 409 });
      }
      if (order.trackingNumber && !body.force) {
        return NextResponse.json({ error: 'Für diese Bestellung gibt es schon ein Etikett.' }, { status: 409 });
      }
      const country = order.address?.country || order.country;
      const cfg = await getShopConfig({ fresh: true });
      const zone = zoneFor(cfg, country);
      if (zone?.carrier !== 'dhl-express' || !zone.dhlProductCode) {
        return NextResponse.json(
          { error: `Für ${country} ist kein automatisches DHL-Etikett eingestellt (Verwaltung → Versand). Etikett beim Versanddienst erstellen und die Sendungsnummer unten eintragen.` },
          { status: 422 }
        );
      }
      if (!order.address?.line1 || !order.address?.postalCode || !order.address?.city) {
        return NextResponse.json({ error: 'Die Lieferadresse ist unvollständig.' }, { status: 422 });
      }
      const products = await getProducts();
      const grams =
        cfg.parcel.packagingWeightG +
        order.items.reduce((sum, it) => {
          const w = products.find((p) => p.slug === it.slug)?.weight ?? cfg.parcel.defaultItemWeightG;
          return sum + w * it.quantity;
        }, 0);
      const result = await createDhlExpressLabel({
        reference: order.orderNumber,
        productCode: zone.dhlProductCode,
        weightKg: grams / 1000,
        company: cfg.company,
        parcel: cfg.parcel,
        recipient: {
          name: order.shippingName || order.customerName,
          email: order.email,
          phone: order.phone,
          line1: order.address.line1,
          line2: order.address.line2,
          postalCode: order.address.postalCode,
          city: order.address.city,
          country,
        },
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
      await saveLabel(order.orderNumber, {
        carrier: 'DHL Express',
        trackingNumber: result.result.trackingNumber,
        trackingUrl: dhlTrackingUrl(result.result.trackingNumber, order.locale),
        labelPdf: result.result.labelPdfBase64,
        mode: result.result.mode,
      });
      return NextResponse.json({ ok: true, trackingNumber: result.result.trackingNumber, mode: result.result.mode });
    }

    if (body.action === 'mark-shipped') {
      if (order.status !== 'paid' && order.status !== 'shipped') {
        return NextResponse.json({ error: 'Nur bezahlte Bestellungen können als versendet markiert werden.' }, { status: 409 });
      }
      const trackingNumber = (body.trackingNumber ?? order.trackingNumber ?? '').trim();
      if (!TRACKING_RE.test(trackingNumber)) {
        return NextResponse.json({ error: 'Bitte eine gültige Sendungsnummer eintragen.' }, { status: 400 });
      }
      const carrier = (body.carrier ?? order.carrier ?? 'DHL').slice(0, 40);
      const isDhl = carrier.toUpperCase().includes('DHL');
      const trackingUrl = isDhl ? dhlTrackingUrl(trackingNumber, order.locale) : '';
      await markShipped(order.orderNumber, { carrier, trackingNumber, trackingUrl });
      const alreadyShipped = order.status === 'shipped' && order.trackingNumber === trackingNumber;
      if (!alreadyShipped) await sendShippingConfirmation(order, { carrier, trackingNumber, trackingUrl });
      return NextResponse.json({ ok: true, emailed: !alreadyShipped });
    }

    if (body.action === 'refresh-tracking') {
      if (!order.trackingNumber) return NextResponse.json({ error: 'Keine Sendungsnummer vorhanden.' }, { status: 409 });
      const t = await fetchDhlTracking(order.trackingNumber);
      if (!t.ok) return NextResponse.json({ error: t.error }, { status: 502 });
      await updateTracking(order.orderNumber, t.state, t.description);
      return NextResponse.json({ ok: true, state: t.state, description: t.description });
    }

    return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });
  } catch (error) {
    console.error('[Versand]', error);
    return NextResponse.json({ error: 'Interner Fehler – siehe Server-Protokoll.' }, { status: 500 });
  }
}
