'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJson } from './save';
import { ORDER_STATUS_LABEL } from '@/lib/orderStatus';

// Erlaubte Statusänderungen von Hand. Zahlungsstatus setzt nur Stripe.
export default function OrderStatusControl({ orderNumber, status, options }: { orderNumber: string; status: string; options: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  if (!options.length) return null;

  async function change(to: string) {
    const warn =
      to === 'cancelled' && status === 'paid'
        ? 'Bestellung stornieren? Der Bestand wird zurückgebucht. WICHTIG: Das Geld musst du zusätzlich im Stripe-Dashboard erstatten – der Status wechselt dann automatisch auf „Erstattet“.'
        : `Status auf „${ORDER_STATUS_LABEL[to]}“ ändern?`;
    if (!window.confirm(warn)) return;
    setBusy(true);
    const r = await postJson('/admin/api/orders', { orderNumber, status: to });
    setBusy(false);
    setMsg(r.ok ? (r.restocked ? 'Gespeichert, Bestand zurückgebucht.' : 'Gespeichert.') : r.message);
    if (r.ok) router.refresh();
  }

  return (
    <div className="admin-actions" style={{ marginTop: 8 }}>
      {options.map((to) => (
        <button key={to} className="btn btn-outline" style={{ minHeight: 32, padding: '2px 12px', fontSize: '0.85rem' }} disabled={busy} onClick={() => change(to)}>
          {to === 'cancelled' ? 'Stornieren' : `Als „${ORDER_STATUS_LABEL[to]}“ markieren`}
        </button>
      ))}
      {msg && <small role="status">{msg}</small>}
    </div>
  );
}
