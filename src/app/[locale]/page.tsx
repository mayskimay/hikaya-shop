import Link from 'next/link';
import { getDict } from '@/lib/dict';
import { isLocale, defaultLocale, type Locale } from '@/lib/i18n';
import { getCategories, getProducts } from '@/lib/data';
import { filterProducts, type Product } from '@/lib/products';
import { site } from '@/lib/site';
import ProductCard from '@/components/ProductCard';

function Row({
  title,
  viewAll,
  href,
  items,
  locale,
  saleLabel,
}: {
  title: string;
  viewAll: string;
  href: string;
  items: Product[];
  locale: Locale;
  saleLabel: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="section container">
      <div className="section-head">
        <h2>{title}</h2>
        <Link href={href}>{viewAll} →</Link>
      </div>
      <div className="grid">
        {items.slice(0, 4).map((p) => (
          <ProductCard key={p.slug} product={p} locale={locale} saleLabel={saleLabel} />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);
  const shop = `/${locale}/shop`;
  const [categories, all] = await Promise.all([getCategories(), getProducts()]);

  const socials = [
    { label: 'Instagram', url: site.instagram },
    { label: 'TikTok', url: site.tiktok },
    { label: 'WhatsApp', url: site.whatsapp },
  ].filter((s) => s.url);

  return (
    <>
      <section className="hero">
        <img src="/logo.svg" alt="" className="hero-mark" />
        <p className="eyebrow">{t.tagline}</p>
        <h1>{t.home.heroTitle}</h1>
        <p>{t.home.heroText}</p>
        <Link href={shop} className="btn">
          {t.home.heroCta}
        </Link>
      </section>

      <section className="section container">
        <h2>{t.home.categoriesTitle}</h2>
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.id} href={`${shop}?category=${c.id}`} className="cat-tile">
              {c.name[locale]}
              <small>{c.children.map((s) => s.name[locale]).join(' · ')}</small>
            </Link>
          ))}
        </div>
      </section>

      <Row
        title={t.home.newTitle}
        viewAll={t.home.viewAll}
        href={`${shop}?category=new`}
        items={filterProducts(all, 'new')}
        locale={locale}
        saleLabel={t.product.sale}
      />
      <Row
        title={t.home.bestsellersTitle}
        viewAll={t.home.viewAll}
        href={`${shop}?category=best`}
        items={filterProducts(all, 'best')}
        locale={locale}
        saleLabel={t.product.sale}
      />
      <Row
        title={t.home.saleTitle}
        viewAll={t.home.viewAll}
        href={`${shop}?category=sale`}
        items={filterProducts(all, 'sale')}
        locale={locale}
        saleLabel={t.product.sale}
      />

      <section className="story">
        <img src="/logo-white.svg" alt="" />
        <h2>{t.home.storyTitle}</h2>
        <p>{t.home.storyText}</p>
        <Link href={`/${locale}/info/about`} className="btn btn-light">
          {t.home.storyCta}
        </Link>
      </section>

      <section className="section container contact-box">
        <h2>{t.home.contactTitle}</h2>
        <p>{t.home.contactText}</p>
        <Link href={`/${locale}/info/contact`} className="btn btn-outline">
          {t.home.contactCta}
        </Link>
        {socials.length > 0 && (
          <div className="socials">
            <span>{t.home.followUs}:</span>
            {socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
