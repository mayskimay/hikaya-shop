import { NextRequest, NextResponse } from 'next/server';
import { adminConfigured, isAdminAuthorized } from '@/lib/adminAuth';

const locales = ['de', 'en'];
const defaultLocale = 'de';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Versand-Seite der Inhaberin: nur mit Passwort
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!adminConfigured()) {
      return new NextResponse(
        'Die Versand-Seite ist noch nicht eingerichtet: ADMIN_USER und ADMIN_PASSWORD (mind. 12 Zeichen) bei Vercel eintragen.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }
    if (!isAdminAuthorized(request.headers.get('authorization'))) {
      return new NextResponse('Anmeldung erforderlich', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Hikaya Versand", charset="UTF-8"' },
      });
    }
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store');
    return res;
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
  matcher: ['/((?!_next|api|studio|favicon.ico|.*\\..*).*)'],
};
