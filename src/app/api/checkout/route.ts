import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/data';
import { currentPrice } from '@/lib/products';
import { shop } from '@/lib/shop';
import { isLocale, defaultLocale } from '@/lib/i18n';

// Legt bei Stripe eine Checkout-Sitzung an und gibt die Adresse der Zahlungsseite zurück.
// Preise und Bestand werden hier neu aus dem Shop gelesen, nie vom Browser übernommen.

export const dynamic = 'force-dynamic';

interface Item {
  slug: string;
  size: string;
  color: string;
  qty: number;
}

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  let body: { locale?: string; items?: Item[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const locale = isLocale(body.locale ?? '') ? (body.locale as 'de' | 'en') : defaultLocale;
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const products = await getProducts();
  const params = new URLSearchParams();
  let subtotal = 0;
  const summary: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const p = products.find((x) => x.slug === it.slug);
    const color = p?.colors.find((c) => c.hex === it.color);
    const qty = Math.floor(Number(it.qty));
    if (!p || !color || !p.sizes.includes(it.size) || !(qty >= 1 && qty <= shop.maxQtyPerItem)) {
      return NextResponse.json({ error: 'invalid_item' }, { status: 400 });
    }
    if (p.stock < qty) {
      return NextResponse.json({ error: 'stock', name: p.name[locale] }, { status: 409 });
    }
    const unit = Math.round(currentPrice(p) * 100);
    subtotal += unit * qty;
    const pre = `line_items[${i}]`;
    params.set(`${pre}[quantity]`, String(qty));
    params.set(`${pre}[price_data][currency]`, 'eur');
    params.set(`${pre}[price_data][unit_amount]`, String(unit));
    params.set(`${pre}[price_data][product_data][name]`, p.name[locale]);
    params.set(`${pre}[price_data][product_data][description]`, `${it.size} · ${color.name[locale]}`);
    const img = p.images[0];
    if (img && img.startsWith('http')) {
      params.set(`${pre}[price_data][product_data][images][0]`, img);
    }
    summary.push(`${p.slug}|${it.size}|${it.color}|${qty}`);
  }

  const origin = req.headers.get('origin') ?? new URL(req.url).origin;
  params.set('mode', 'payment');
  params.set('locale', locale);
  params.set('success_url', `${origin}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/${locale}/cart`);
  params.set('phone_number_collection[enabled]', 'true');
  shop.countries.forEach((c, i) => params.set(`shipping_address_collection[allowed_countries][${i}]`, c));
  params.set('metadata[items]', summary.join(';').slice(0, 480));

  const free = subtotal >= shop.shipping.freeFrom * 100;
  const sp = 'shipping_options[0][shipping_rate_data]';
  params.set(`${sp}[type]`, 'fixed_amount');
  params.set(`${sp}[display_name]`, shop.shipping.label[locale]);
  params.set(`${sp}[fixed_amount][amount]`, String(free ? 0 : Math.round(shop.shipping.amount * 100)));
  params.set(`${sp}[fixed_amount][currency]`, 'eur');

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    console.error('Stripe-Fehler', data?.error?.message);
    return NextResponse.json({ error: 'stripe' }, { status: 502 });
  }
  return NextResponse.json({ url: data.url });
}
