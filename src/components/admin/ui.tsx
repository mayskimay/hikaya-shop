import type { ReactNode } from 'react';
import { STATE_LABEL, type ProviderState, type ProviderStatus } from '@/lib/providers';
import CheckButton from './CheckButton';

export function StateBadge({ state }: { state: ProviderState }) {
  return <span className={`admin-state ${state}`}>{STATE_LABEL[state]}</span>;
}

export function ProviderCard({ p, check, children }: { p: ProviderStatus; check?: string; children?: ReactNode }) {
  return (
    <section className="admin-provider" aria-label={p.name}>
      <div className="admin-provider-head">
        <strong>{p.name}</strong>
        <StateBadge state={p.state} />
      </div>
      <p className="note" style={{ margin: '6px 0 0' }}>
        {p.detail}
      </p>
      {p.steps.length > 0 && (
        <>
          <p style={{ margin: '10px 0 0', fontSize: '0.92rem' }}>
            <strong>Noch zu tun:</strong>
          </p>
          <ol>
            {p.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </>
      )}
      {children}
      {(p.links.length > 0 || check) && (
        <div className="admin-links">
          {check && <CheckButton provider={check} />}
          {p.links.map((l) => (
            <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export function NeedsSanity() {
  return (
    <p className="admin-msg warn">
      Sanity ist noch nicht verbunden. Du siehst hier die Startwerte bzw. Beispieldaten; Änderungen können erst gespeichert
      werden, wenn NEXT_PUBLIC_SANITY_PROJECT_ID und SANITY_API_WRITE_TOKEN bei Vercel eingetragen sind (siehe Zahlungen →
      „Weitere Dienste“ bzw. README).
    </p>
  );
}

export const eur = (v: number) => new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(v);
export const date = (s?: string) => (s ? new Date(s).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Vienna' }) : '');
