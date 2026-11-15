import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/data';
import { currentPrice } from '@/lib/products';
import { allShippingCountries, shippingCost, shop, zoneForCountry } from '@/lib/shop';
import { isLocale, defaultLocale } from '@/lib/i18n';
import { getStripeConfig, stripeRequest } from '@/lib/stripe';

// Legt bei Stripe eine Checkout-Sitzung an und gibt die Adresse der Zahlungsseite zurück.
// - Preise, Bestand und Versandkosten werden hier neu berechnet, nie vom Browser übernommen.
// - Karten- und Bankdaten gibt die Kundin nur auf der sicheren Stripe-Seite ein.
// - Welche Zahlungsarten angezeigt werden (Karte, PayPal, EPS, SEPA-Lastschrift, Klarna …),
//   wird im Stripe-Dashboard eingestellt („dynamische Zahlungsmethoden“).

export const dynamic = 'force-dynamic';

interface Item {
  slug: string;
  size: string;
  color: string;
  qty: number;
}

export async function POST(req: Request) {
  const cfg = getStripeConfig();
  if (!cfg.ok) {
    console.error('[Kasse] Stripe nicht bereit:', cfg.reason);
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  let body: { locale?: string; items?: Item[]; country?: string; acceptedTerms?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const locale = isLocale(body.locale ?? '') ? (body.locale as 'de' | 'en') : defaultLocale;
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (items.length === 0) return NextResponse.json({ error: 'empty' }, { status: 400 });
  if (body.acceptedTerms !== true) return NextResponse.json({ error: 'terms' }, { status: 400 });

  const country = String(body.country ?? '').toUpperCase();
  const zone = zoneForCountry(country);
  if (!zone || !allShippingCountries.includes(country)) {
    return NextResponse.json({ error: 'country' }, { status: 400 });
  }

  const products = await getProducts();
  const params = new URLSearchParams();
  let subtotalCents = 0;
  const summary: string[] = [];
  const qtyBySlug = new Map<string, number>();

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const p = products.find((x) => x.slug === it.slug);
    const color = p?.colors.find((c) => c.hex === it.color);
    const qty = Math.floor(Number(it.qty));
    if (!p || !color || !p.sizes.includes(it.size) || !(qty >= 1 && qty <= shop.maxQtyPerItem)) {
      return NextResponse.json({ error: 'invalid_item' }, { status: 400 });
    }
    const totalForProduct = (qtyBySlug.get(p.slug) ?? 0) + qty;
    qtyBySlug.set(p.slug, totalForProduct);
    if (p.stock < totalForProduct) {
      return NextResponse.json({ error: 'stock', name: p.name[locale] }, { status: 409 });
    }
    const unit = Math.round(currentPrice(p) * 100);
    subtotalCents += unit * qty;
    const pre = `line_items[${i}]`;
    params.set(`${pre}[quantity]`, String(qty));
    params.set(`${pre}[price_data][currency]`, shop.currency);
    params.set(`${pre}[price_data][unit_amount]`, String(unit));
    params.set(`${pre}[price_data][product_data][name]`, p.name[locale]);
    params.set(`${pre}[price_data][product_data][description]`, `${it.size} · ${color.name[locale]}`);
    const img = p.images[0];
    if (img && img.startsWith('https://')) {
      params.set(`${pre}[price_data][product_data][images][0]`, img);
    }
    summary.push(`${p.slug}|${it.size}|${color.name[locale]}|${qty}`);
  }

  // Warenkorb-Inhalt für den Webhook mitgeben (Stripe erlaubt max. 500 Zeichen je Feld)
  const joined = summary.join(';');
  const chunks = joined.match(/.{1,490}/g) ?? [];
  if (chunks.length > 40) return NextResponse.json({ error: 'too_many' }, { status: 400 });
  chunks.forEach((c, i) => params.set(`metadata[items_${i}]`, c));
  params.set('metadata[items_n]', String(chunks.length));
  params.set('metadata[locale]', locale);
  params.set('metadata[country]', country);
  params.set('metadata[terms_accepted_at]', new Date().toISOString());

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || req.headers.get('origin') || new URL(req.url).origin;
  params.set('mode', 'payment');
  params.set('locale', locale);
  params.set('success_url', `${origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/${locale}/cart`);
  params.set('phone_number_collection[enabled]', 'true');
  params.set('billing_address_collection', 'auto');
  // Lieferland wurde im Warenkorb gewählt – nur dieses Land zulassen, damit die Versandkosten stimmen
  params.set('shipping_address_collection[allowed_countries][0]', country);

  const shippingEuro = shippingCost(country, subtotalCents / 100) ?? zone.amount;
  const sp = 'shipping_options[0][shipping_rate_data]';
  params.set(`${sp}[type]`, 'fixed_amount');
  params.set(`${sp}[display_name]`, `${locale === 'de' ? 'Standardversand' : 'Standard shipping'} (${zone.label[locale]})`);
  params.set(`${sp}[fixed_amount][amount]`, String(Math.round(shippingEuro * 100)));
  params.set(`${sp}[fixed_amount][currency]`, shop.currency);

  // Hinweis direkt über dem Bezahl-Knopf auf der Stripe-Seite
  params.set(
    'custom_text[submit][message]',
    locale === 'de'
      ? 'Mit Klick auf „Bezahlen“ bestellst du zahlungspflichtig. Es gelten unsere AGB und die Widerrufsbelehrung.'
      : 'By clicking “Pay” you place a binding order. Our terms and withdrawal policy apply.'
  );

  const result = await stripeRequest<{ url?: string; id: string }>('POST', '/checkout/sessions', params);
  if (!result.ok || !result.data.url) {
    console.error('[Kasse] Stripe-Fehler', result.ok ? 'keine URL' : result.message);
    return NextResponse.json({ error: 'stripe' }, { status: 502 });
  }
  return NextResponse.json({ url: result.data.url });
}
