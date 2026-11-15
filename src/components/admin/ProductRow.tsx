'use client';

import { useState } from 'react';
import { postJson } from './save';

// Eine Zeile in /admin/produkte: Preis, Sale-Preis und Bestand direkt ändern
export default function ProductRow({
  id,
  editable,
  price,
  salePrice,
  stock,
}: {
  id: string;
  editable: boolean;
  price: number;
  salePrice?: number;
  stock: number;
}) {
  const [v, setV] = useState({ price: String(price), salePrice: salePrice ? String(salePrice) : '', stock: String(stock) });
  const [saved, setSaved] = useState(v);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = v.price !== saved.price || v.salePrice !== saved.salePrice || v.stock !== saved.stock;

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = await postJson('/admin/api/products', {
      id,
      price: Number(v.price.replace(',', '.')),
      salePrice: v.salePrice.trim() === '' ? '' : Number(v.salePrice.replace(',', '.')),
      stock: Number(v.stock),
    });
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) setSaved(v);
  }

  const input = (k: keyof typeof v, label: string, step: string) => (
    <input
      aria-label={label}
      inputMode="decimal"
      value={v[k]}
      step={step}
      disabled={!editable}
      onChange={(e) => setV({ ...v, [k]: e.target.value })}
    />
  );

  return (
    <>
      <td>{input('price', 'Preis in Euro', '0.01')}</td>
      <td>{input('salePrice', 'Sale-Preis in Euro (leer = kein Sale)', '0.01')}</td>
      <td>
        {input('stock', 'Bestand in Stück', '1')}
        {Number(v.stock) === 0 && <span className="admin-tag warn">ausverkauft</span>}
      </td>
      <td style={{ minWidth: 120 }}>
        {editable && (
          <button className="btn" style={{ minHeight: 34, padding: '2px 12px' }} disabled={!dirty || busy} onClick={save}>
            {busy ? '…' : 'Speichern'}
          </button>
        )}
        {msg && (
          <small role="status" style={{ display: 'block', color: msg.ok ? 'inherit' : 'var(--sale)' }}>
            {msg.text}
          </small>
        )}
      </td>
    </>
  );
}
