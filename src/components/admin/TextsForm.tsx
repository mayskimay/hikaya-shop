'use client';

import { useState } from 'react';
import { postJson } from './save';

export interface TextRow {
  key: string;
  label: string;
  long: boolean;
  legal: boolean;
  value: { de: string; en: string }; // eigener Text (leer = Standardtext)
  fallback: { de: string; en: string }; // Standardtext aus dem Code
}

export default function TextsForm({ rows, canSave }: { rows: TextRow[]; canSave: boolean }) {
  const [v, setV] = useState<Record<string, { de: string; en: string }>>(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; message: string } | null>(null);

  async function save() {
    setBusy(true);
    setRes(null);
    setRes(await postJson('/admin/api/settings', { type: 'texts', data: v }));
    setBusy(false);
  }

  const field = (r: TextRow, lang: 'de' | 'en') => {
    const props = {
      value: v[r.key][lang],
      placeholder: r.fallback[lang],
      onChange: (e: { target: { value: string } }) => setV({ ...v, [r.key]: { ...v[r.key], [lang]: e.target.value } }),
    };
    return (
      <label>
        {lang === 'de' ? 'Deutsch' : 'English'}
        {r.long ? <textarea {...props} rows={r.legal ? 10 : 4} /> : <input {...props} />}
      </label>
    );
  };

  return (
    <div className="admin-form">
      {rows.map((r) => (
        <fieldset key={r.key}>
          <legend>
            {r.label}
            {r.legal && <span className="admin-tag warn">rechtlich prüfen</span>}
          </legend>
          <div className="admin-grid2">
            {field(r, 'de')}
            {field(r, 'en')}
          </div>
          <span className="hint">Leer lassen = grauer Standardtext wird angezeigt. Ist nur eine Sprache ausgefüllt, gilt sie für beide.</span>
        </fieldset>
      ))}
      <div className="admin-savebar">
        <button className="btn" onClick={save} disabled={busy || !canSave}>
          {busy ? 'Speichere …' : 'Texte speichern'}
        </button>
        {!canSave && <span className="note">Speichern erst möglich, wenn Sanity verbunden ist.</span>}
        {res && <div role="status" className={`admin-msg ${res.ok ? '' : 'err'}`}>{res.message}</div>}
      </div>
    </div>
  );
}
