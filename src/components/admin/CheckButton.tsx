'use client';

import { useState } from 'react';

// „Verbindung prüfen“ – testet die Zugangsdaten, ohne Zahlungen oder Sendungen auszulösen
export default function CheckButton({ provider }: { provider: string }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; message: string } | null>(null);
  async function run() {
    setBusy(true);
    setRes(null);
    try {
      const r = await fetch('/admin/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      setRes(await r.json());
    } catch {
      setRes({ ok: false, message: 'Verbindungsfehler' });
    }
    setBusy(false);
  }
  return (
    <>
      <button type="button" className="btn btn-outline" style={{ minHeight: 32, padding: '2px 12px', fontSize: '0.85rem' }} onClick={run} disabled={busy}>
        {busy ? 'Prüfe …' : 'Verbindung prüfen'}
      </button>
      {res && (
        <span role="status" className={`admin-msg ${res.ok ? '' : 'err'}`} style={{ margin: 0, padding: '4px 10px', fontSize: '0.85rem' }}>
          {res.message}
        </span>
      )}
    </>
  );
}
