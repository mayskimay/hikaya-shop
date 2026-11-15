import { NextResponse } from 'next/server';
import { verifyStripeSignature, getStripeConfig, type CheckoutSession } from '@/lib/stripe';
import { getSession, buildOrder } from '@/lib/fulfillment';
import { saveOrder, setOrderStatus, orderNumberFor } from '@/lib/orders';
import { sendCustomerConfirmation, sendOwnerNotification } from '@/lib/email';

// Stripe meldet hier, wenn eine Zahlung abgeschlossen ist. Nur über diesen Weg gilt
// eine Bestellung als bezahlt – die Danke-Seite allein reicht dafür nicht.
//
// Im Stripe-Dashboard einrichten (Entwickler → Webhooks), Adresse:
//   https://DEINE-DOMAIN/api/stripe/webhook
// Ereignisse: checkout.session.completed, checkout.session.async_payment_succeeded,
//             checkout.session.async_payment_failed
// Das "Signing secret" (whsec_…) als STRIPE_WEBHOOK_SECRET eintragen.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface StripeEvent {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: CheckoutSession };
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? '';
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get('stripe-signature'), secret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
  }

  // Ereignisse aus dem falschen Modus ignorieren (z. B. Live-Ereignis bei Test-Schlüssel)
  const cfg = getStripeConfig();
  if (!cfg.ok) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (event.livemode !== (cfg.config.mode === 'live')) {
    return NextResponse.json({ received: true, ignored: 'mode_mismatch' });
  }

  const relevant = [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
  ];
  if (!relevant.includes(event.type)) return NextResponse.json({ received: true });

  try {
    // Sitzung frisch von Stripe laden (statt dem Ereignis-Inhalt blind zu vertrauen)
    const session = await getSession(event.data.object.id);
    if (!session) throw new Error('Sitzung nicht gefunden');

    if (event.type === 'checkout.session.async_payment_failed') {
      await setOrderStatus(orderNumberFor(session.id, session.created), 'payment_failed');
      return NextResponse.json({ received: true });
    }

    const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
    const order = await buildOrder(session, paid ? 'paid' : 'awaiting_payment');
    const { newlyPaid, created } = await saveOrder(order);

    if (event.type === 'checkout.session.completed' && (paid ? newlyPaid : created)) {
      await sendCustomerConfirmation(order, paid ? 'paid' : 'pending');
      await sendOwnerNotification(order);
    } else if (event.type === 'checkout.session.async_payment_succeeded' && newlyPaid) {
      await sendCustomerConfirmation(order, 'payment_confirmed');
      await sendOwnerNotification(order);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // Fehler → Stripe versucht es automatisch später erneut
    console.error('[Webhook] Verarbeitung fehlgeschlagen', error);
    return NextResponse.json({ error: 'processing_failed' }, { status: 500 });
  }
}
