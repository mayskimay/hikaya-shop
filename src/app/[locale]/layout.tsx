import type { ReactNode } from 'react';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import '../globals.css';
import { CartProvider } from '@/lib/cart';
import { getDict } from '@/lib/dict';
import { isLocale, locales, defaultLocale } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Intro from '@/components/Intro';

const display = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
});
const body = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-body',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getDict(locale);

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        {/* Wurde die Animation in dieser Sitzung schon gezeigt, wird sie sofort ausgeblendet */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('hikaya-intro')==='1')document.documentElement.setAttribute('data-intro','seen')}catch(e){}",
          }}
        />
        <Intro tagline={t.tagline} skipLabel={t.skip} />
        <CartProvider>
          <Header locale={locale} t={t.nav} />
          <main>{children}</main>
          <Footer locale={locale} t={t.footer} />
        </CartProvider>
      </body>
    </html>
  );
}
