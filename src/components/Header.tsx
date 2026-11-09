'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import type { Locale } from '@/lib/i18n';
import type { Dict } from '@/lib/dict';

export default function Header({ locale, t }: { locale: Locale; t: Dict['nav'] }) {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  // Gleiche Seite in der anderen Sprache
  const switchTo = (target: Locale) => {
    const rest = pathname.replace(/^\/(de|en)/, '');
    return `/${target}${rest}`;
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href={`/${locale}`} className="logo" aria-label="Hikaya">
          <img src="/logo-dark.svg" alt="" width={34} height={34} />
          <span>Hikaya</span>
        </Link>

        <nav className={open ? 'nav open' : 'nav'} onClick={() => setOpen(false)}>
          <Link href={`/${locale}/shop`}>{t.shop}</Link>
          <Link href={`/${locale}/shop?category=new`}>{t.new}</Link>
          <Link href={`/${locale}/shop?category=best`}>{t.bestsellers}</Link>
          <Link href={`/${locale}/shop?category=sale`}>{t.sale}</Link>
        </nav>

        <div className="header-right">
          <span className="lang">
            <Link href={switchTo('de')} className={locale === 'de' ? 'active' : ''}>DE</Link>|
            <Link href={switchTo('en')} className={locale === 'en' ? 'active' : ''}>EN</Link>
          </span>
          <Link href={`/${locale}/cart`} className="cart-link">
            {t.cart}
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label={t.menu}>
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}
