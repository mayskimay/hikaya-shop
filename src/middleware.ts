import { NextRequest, NextResponse } from 'next/server';
import { adminConfigured, readCookie, verifySessionToken } from '@/lib/adminAuth';

const locales = ['de', 'en'];
const defaultLocale = 'de';

// Ohne Anmeldung erreichbar: die Login-Seite selbst und das Absenden des Formulars
const PUBLIC_ADMIN = ['/admin/login', '/admin/api/login'];

function noStore(res: NextResponse) {
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'same-origin');
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verwaltungsbereich und CMS: nur mit gültiger Anmeldung
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const isStudio = pathname === '/studio' || pathname.startsWith('/studio/');
  if (isAdmin || isStudio) {
    if (PUBLIC_ADMIN.includes(pathname)) return noStore(NextResponse.next());

    const session = adminConfigured()
      ? await verifySessionToken(readCookie(request.headers.get('cookie')))
      : null;
    if (session) return noStore(NextResponse.next());

    if (pathname.startsWith('/admin/api/')) {
      return noStore(NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 }));
    }
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    if (pathname !== '/admin') url.searchParams.set('next', pathname);
    return noStore(NextResponse.redirect(url));
  }

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
