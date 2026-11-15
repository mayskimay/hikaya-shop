import { adminSetup } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hikaya – Anmeldung' };

const MESSAGES: Record<string, string> = {
  wrong: 'Benutzername oder Passwort stimmt nicht.',
  out: 'Du bist abgemeldet.',
  setup: 'Die Anmeldung ist noch nicht eingerichtet (siehe unten).',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; m?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const setup = adminSetup();
  const msg = sp.e === 'locked' ? `Zu viele Fehlversuche. Bitte in ${sp.m ?? 15} Minuten erneut versuchen.` : MESSAGES[sp.e ?? ''];
  const next = typeof sp.next === 'string' && /^\/(admin|studio)/.test(sp.next) ? sp.next : '/admin';

  return (
    <main className="admin-login">
      <div className="admin-login-box">
        <img src="/logo.svg" alt="" width={56} height={56} />
        <h1>Hikaya Verwaltung</h1>
        {msg && (
          <p className={`admin-msg ${sp.e === 'out' ? '' : 'err'}`} role="alert">
            {msg}
          </p>
        )}
        {setup.ok ? (
          <form method="post" action="/admin/api/login">
            <input type="hidden" name="next" value={next} />
            <label>
              Benutzername
              <input name="user" autoComplete="username" required autoFocus />
            </label>
            <label>
              Passwort
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button className="btn btn-block" type="submit">
              Anmelden
            </button>
            <small className="note">Nach 5 Fehlversuchen wird die Anmeldung für 15 Minuten gesperrt. Die Sitzung endet nach 8 Stunden.</small>
          </form>
        ) : (
          <div className="admin-msg err">
            <strong>Der Verwaltungsbereich ist gesperrt, bis die Anmeldung eingerichtet ist.</strong>
            <p>Bei Vercel unter Settings → Environment Variables eintragen und neu deployen:</p>
            <ul>
              {setup.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <small>Anleitung: README → „Verwaltungsbereich /admin“.</small>
          </div>
        )}
      </div>
    </main>
  );
}
