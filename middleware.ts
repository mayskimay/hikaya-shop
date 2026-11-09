import { NextRequest, NextResponse } from 'next/server';

const locales = ['de', 'en'];
const defaultLocale = 'de';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return;

  // Browsersprache erkennen, sonst Deutsch
  const accept = request.headers.get('accept-language') ?? '';
  const locale = accept.toLowerCase().startsWith('en') ? 'en' : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
