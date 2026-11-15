'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ShipmentActions({
  orderNumber,
  status,
  hasLabel,
  trackingNumber,
  autoLabel,
}: {
  orderNumber: string;
  status: string;
  hasLabel: boolean;
  trackingNumber: string;
  autoLabel: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [manual, setManual] = useState(trackingNumber);
  const [carrier, setCarrier] = useState('DHL');

  async function call(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setMsg('');
    try {
      const res = await fetch('/admin/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, orderNumber, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? 'Fehler');
      else {
        if (action === 'create-label') setMsg(`Etikett erstellt: ${data.trackingNumber}${data.mode === 'test' ? ' (TEST – nicht gültig)' : ''}`);
        if (action === 'mark-shipped') setMsg(data.emailed ? 'Als versendet markiert, E-Mail an Kundin verschickt.' : 'Gespeichert.');
        if (action === 'refresh-tracking') setMsg(`DHL-Status: ${data.description || data.state}`);
        router.refresh();
      }
    } catch {
      setMsg('Verbindungsfehler');
    }
    setBusy('');
  }

  if (status === 'awaiting_payment') return null;

  return (
    <div className="admin-actions">
      {status === 'paid' && autoLabel && !trackingNumber && (
        <button className="btn" disabled={!!busy} onClick={() => call('create-label')}>
          {busy === 'create-label' ? 'Erstelle …' : 'DHL-Etikett erstellen'}
        </button>
      )}
      {hasLabel && (
        <a className="btn btn-outline" href={`/admin/api/label?order=${encodeURIComponent(orderNumber)}`} target="_blank" rel="noopener">
          Etikett öffnen / drucken
        </a>
      )}
      {status === 'paid' && (
        <div className="admin-manual">
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)} aria-label="Versanddienst">
            <option value="DHL">DHL</option>
            <option value="DHL Express">DHL Express</option>
            <option value="Österreichische Post">Österreichische Post</option>
          </select>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Sendungsnummer"
            aria-label="Sendungsnummer"
          />
          <button
            className="btn"
            disabled={!!busy || !manual.trim()}
            onClick={() => call('mark-shipped', { trackingNumber: manual.trim(), carrier })}
          >
            {busy === 'mark-shipped' ? 'Speichere …' : 'Paket ist abgegeben → Kundin informieren'}
          </button>
        </div>
      )}
      {(status === 'shipped' || status === 'delivered') && trackingNumber && (
        <button className="btn btn-outline" disabled={!!busy} onClick={() => call('refresh-tracking')}>
          {busy === 'refresh-tracking' ? 'Frage ab …' : 'DHL-Status abfragen'}
        </button>
      )}
      {msg && <p className="note" role="status">{msg}</p>}
    </div>
  );
}
