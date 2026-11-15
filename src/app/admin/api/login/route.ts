import {
  adminConfigured,
  checkCredentials,
  createSessionToken,
  loginLocked,
  registerFailure,
  registerSuccess,
  sameOrigin,
  sessionCookie,
} from '@/lib/adminAuth';

// Anmeldung: prüft Benutzer und Passwort serverseitig und setzt das Sitzungs-Cookie.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Nur interne Ziele zulassen (keine Weiterleitung auf fremde Seiten)
function safeNext(v: FormDataEntryValue | null): string {
  const s = typeof v === 'string' ? v : '';
  return /^\/(admin|studio)(\/[A-Za-z0-9\-_/;=.]*)?$/.test(s) ? s : '/admin';
}

function redirect(req: Request, path: string, cookie?: string) {
  const headers = new Headers({ Location: new URL(path, req.url).toString(), 'Cache-Control': 'no-store' });
  if (cookie) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response('Anfrage abgelehnt', { status: 403 });
  if (!adminConfigured()) return redirect(req, '/admin/login?e=setup');

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const locked = loginLocked(ip);
  if (locked) return redirect(req, `/admin/login?e=locked&m=${locked}`);

  const form = await req.formData().catch(() => null);
  const user = String(form?.get('user') ?? '').slice(0, 200);
  const password = String(form?.get('password') ?? '').slice(0, 500);
  const next = safeNext(form?.get('next') ?? null);

  if (!(await checkCredentials(user, password))) {
    registerFailure(ip);
    await sleep(800); // bremst automatisiertes Raten
    return redirect(req, `/admin/login?e=wrong${next !== '/admin' ? `&next=${encodeURIComponent(next)}` : ''}`);
  }
  registerSuccess(ip);
  const secure = new URL(req.url).protocol === 'https:';
  return redirect(req, next, sessionCookie(await createSessionToken(user), secure));
}
