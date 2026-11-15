// Anmeldung für den Verwaltungsbereich /admin.
//
// - Zugangsdaten stehen nur in Umgebungsvariablen (Vercel): ADMIN_USER, ADMIN_PASSWORD,
//   ADMIN_SESSION_SECRET. Es gibt KEIN Standardpasswort: Fehlt etwas oder ist das
//   Passwort zu schwach, bleibt /admin gesperrt.
// - Nach der Anmeldung bekommt der Browser ein signiertes Sitzungs-Cookie (HttpOnly,
//   Secure, SameSite=Strict, 8 Stunden gültig). Die Signatur (HMAC-SHA256) kann ohne
//   ADMIN_SESSION_SECRET nicht gefälscht werden.
// - Alle Sitzungen beenden: ADMIN_SESSION_SECRET bei Vercel ändern und neu deployen.
// - Funktioniert in der Middleware (Edge) und in Server-Routen (Node): nur Web Crypto.

export const SESSION_COOKIE = 'hk_admin';
export const SESSION_HOURS = 8;

const enc = new TextEncoder();

const env = (k: string) => process.env[k]?.trim() ?? '';

// Teile, die in einem Passwort nicht vorkommen dürfen (leicht zu erraten)
const WEAK_PARTS = ['passwort', 'password', 'admin', 'hikaya', '123456', 'qwertz', 'qwerty', 'abcdef', 'letmein', 'willkommen', 'welcome'];

// Gibt die Gründe zurück, warum ein Passwort nicht genügt (leer = in Ordnung)
export function passwordProblems(password: string, user = ''): string[] {
  const p = password;
  const problems: string[] = [];
  if (p.length < 12) problems.push('mindestens 12 Zeichen');
  const lower = p.toLowerCase();
  if (WEAK_PARTS.some((w) => lower.includes(w))) problems.push('keine leicht zu erratenden Wörter (z. B. „passwort“, „admin“, „hikaya“, „123456“)');
  if (user && lower.includes(user.toLowerCase())) problems.push('darf den Benutzernamen nicht enthalten');
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
  // Lange Passphrasen (ab 20 Zeichen) dürfen einfacher aufgebaut sein
  if (p.length < 20 && classes < 3) problems.push('mindestens 3 von: Kleinbuchstaben, Großbuchstaben, Ziffern, Sonderzeichen (oder 20+ Zeichen)');
  if (/^(.)\1+$/.test(p)) problems.push('nicht nur ein Zeichen wiederholen');
  return problems;
}

export interface AdminSetup {
  ok: boolean;
  problems: string[]; // was bei Vercel noch fehlt (ohne Werte zu verraten)
}

export function adminSetup(): AdminSetup {
  const problems: string[] = [];
  const user = env('ADMIN_USER');
  const pass = env('ADMIN_PASSWORD');
  const secret = env('ADMIN_SESSION_SECRET');
  if (!user) problems.push('ADMIN_USER fehlt');
  if (!pass) problems.push('ADMIN_PASSWORD fehlt');
  else {
    const pp = passwordProblems(pass, user);
    if (pp.length) problems.push(`ADMIN_PASSWORD ist zu schwach: ${pp.join('; ')}`);
  }
  if (secret.length < 32) problems.push('ADMIN_SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen');
  if (secret && secret === pass) problems.push('ADMIN_SESSION_SECRET darf nicht gleich dem Passwort sein');
  return { ok: problems.length === 0, problems };
}

export const adminConfigured = () => adminSetup().ok;

// ---------- Hilfsfunktionen ----------

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(data)));
}

// Vergleich zweier Texte in konstanter Zeit: beide werden zuerst per HMAC gehasht
async function safeEqual(a: string, b: string): Promise<boolean> {
  const k = 'cmp:' + env('ADMIN_SESSION_SECRET');
  const [x, y] = await Promise.all([hmac(k, a), hmac(k, b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// ---------- Anmeldung prüfen ----------

export async function checkCredentials(user: string, password: string): Promise<boolean> {
  if (!adminConfigured()) return false;
  const [u, p] = await Promise.all([safeEqual(user, env('ADMIN_USER')), safeEqual(password, env('ADMIN_PASSWORD'))]);
  return u && p;
}

// ---------- Sitzungs-Cookie ----------

interface SessionPayload {
  u: string; // Benutzername
  iat: number; // ausgestellt (Sekunden)
  exp: number; // gültig bis (Sekunden)
}

export async function createSessionToken(user: string, now = Date.now()): Promise<string> {
  const iat = Math.floor(now / 1000);
  const payload: SessionPayload = { u: user, iat, exp: iat + SESSION_HOURS * 3600 };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = b64url(await hmac(env('ADMIN_SESSION_SECRET'), body));
  return `${body}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null, now = Date.now()): Promise<SessionPayload | null> {
  if (!token || !adminConfigured()) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  let ok = false;
  try {
    ok = await crypto.subtle.verify('HMAC', await hmacKey(env('ADMIN_SESSION_SECRET')), fromB64url(sig) as BufferSource, enc.encode(body));
  } catch {
    return null;
  }
  if (!ok) return null;
  try {
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    const t = Math.floor(now / 1000);
    if (typeof p.exp !== 'number' || p.exp < t || p.iat > t + 60) return null;
    // Nach einer Änderung des Benutzernamens gelten alte Sitzungen nicht mehr
    if (p.u !== env('ADMIN_USER')) return null;
    return p;
  } catch {
    return null;
  }
}

// Liest das Cookie aus einem Cookie-Header (für API-Routen ohne next/headers)
export function readCookie(header: string | null, name = SESSION_COOKIE): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function sessionCookie(token: string, secure: boolean): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${SESSION_HOURS * 3600}`,
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearSessionCookie(secure: boolean): string {
  return [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0', secure ? 'Secure' : ''].filter(Boolean).join('; ');
}

// ---------- Schutz für Server-Routen ----------

// Schreibende Anfragen nur von der eigenen Seite (Schutz gegen fremde Formulare, CSRF)
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(req.url).host || origin === process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  } catch {
    return false;
  }
}

// In jeder Admin-API-Route aufrufen. Gibt null zurück, wenn alles passt, sonst die Fehlerantwort.
export async function requireAdmin(req: Request, opts: { write?: boolean } = {}): Promise<Response | null> {
  const session = await verifySessionToken(readCookie(req.headers.get('cookie')));
  if (!session) return Response.json({ error: 'Nicht angemeldet' }, { status: 401 });
  if (opts.write && !sameOrigin(req)) return Response.json({ error: 'Anfrage abgelehnt' }, { status: 403 });
  return null;
}

// ---------- Sperre nach Fehlversuchen ----------
// Hinweis: Der Zähler liegt im Speicher der jeweiligen Server-Instanz. Er bremst
// automatisiertes Raten zuverlässig, ersetzt aber kein starkes Passwort.

const attempts = new Map<string, { fails: number; until: number }>();
export const MAX_FAILS = 5;
export const LOCK_MINUTES = 15;

export function loginLocked(key: string, now = Date.now()): number {
  const a = attempts.get(key);
  if (a && a.until > now) return Math.ceil((a.until - now) / 60000);
  return 0;
}

export function registerFailure(key: string, now = Date.now()) {
  const a = attempts.get(key) ?? { fails: 0, until: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) {
    a.until = now + LOCK_MINUTES * 60000;
    a.fails = 0;
  }
  attempts.set(key, a);
  if (attempts.size > 5000) attempts.clear();
}

export function registerSuccess(key: string) {
  attempts.delete(key);
}
