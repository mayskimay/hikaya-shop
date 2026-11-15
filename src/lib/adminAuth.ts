// Passwortschutz (HTTP Basic Auth) für die Versand-Seite unter /admin.
// Zugangsdaten über Umgebungsvariablen: ADMIN_USER und ADMIN_PASSWORD.
// Funktioniert in der Middleware (Edge) und in API-Routen (Node).

function safeEqual(a: string, b: string): boolean {
  // Vergleich ohne früh abzubrechen (erschwert das Erraten über Zeitmessung)
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_USER?.trim() && (process.env.ADMIN_PASSWORD?.trim().length ?? 0) >= 12);
}

export function isAdminAuthorized(authHeader: string | null): boolean {
  if (!adminConfigured() || !authHeader?.startsWith('Basic ')) return false;
  let decoded = '';
  try {
    decoded = atob(authHeader.slice(6));
  } catch {
    return false;
  }
  const i = decoded.indexOf(':');
  if (i < 0) return false;
  const user = decoded.slice(0, i);
  const pass = decoded.slice(i + 1);
  const okUser = safeEqual(user, process.env.ADMIN_USER!.trim());
  const okPass = safeEqual(pass, process.env.ADMIN_PASSWORD!.trim());
  return okUser && okPass;
}
