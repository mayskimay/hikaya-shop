'use client';

import { useState } from 'react';
import { postJson } from './save';
import type { Company, Contact } from '@/lib/settings';

type L = { de: string; en: string };

const COMPANY_FIELDS: [keyof Company, string, string?][] = [
  ['name', 'Firmenname / Name der Inhaberin *'],
  ['street', 'Straße und Hausnummer *'],
  ['postalCode', 'PLZ *'],
  ['city', 'Ort *'],
  ['country', 'Land (Code) *', 'z. B. AT'],
  ['email', 'E-Mail *'],
  ['phone', 'Telefon', 'für Versandetiketten Pflicht, z. B. +43 660 1234567'],
  ['trade', 'Gewerbe *', 'z. B. Handelsgewerbe'],
  ['authority', 'Gewerbebehörde *', 'z. B. Magistrat Graz'],
  ['uid', 'UID-Nummer', 'falls vorhanden'],
  ['register', 'Firmenbuch', 'Nummer und Gericht, falls eingetragen'],
];

export default function ShopInfoForm({
  company,
  contact,
  vatNote,
  packagingNote,
  canSave,
}: {
  company: Company;
  contact: Contact;
  vatNote: L;
  packagingNote: L;
  canSave: boolean;
}) {
  const [c, setC] = useState<Record<string, string>>(Object.fromEntries(COMPANY_FIELDS.map(([k]) => [k, company[k] ?? ''])));
  const [k, setK] = useState<Contact>(contact);
  const [vat, setVat] = useState<L>(vatNote);
  const [pack, setPack] = useState<L>(packagingNote);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; message: string; errors?: string[] } | null>(null);

  async function save() {
    setBusy(true);
    setRes(null);
    setRes(await postJson('/admin/api/settings', { type: 'shop', data: { company: c, contact: k, vatNote: vat, packagingNote: pack } }));
    setBusy(false);
  }

  return (
    <div className="admin-form">
      <fieldset>
        <legend>Unternehmen (Impressum, E-Mails, Absender auf Paketen)</legend>
        <div className="admin-grid2">
          {COMPANY_FIELDS.map(([key, label, hint]) => (
            <label key={key}>
              {label}
              <input value={c[key]} onChange={(e) => setC({ ...c, [key]: e.target.value })} />
              {hint && <span className="hint">{hint}</span>}
            </label>
          ))}
        </div>
        <span className="hint">* Pflichtangaben fürs Impressum. Die Angaben bitte rechtlich prüfen lassen.</span>
      </fieldset>

      <fieldset>
        <legend>Kontakt & Social Media</legend>
        <div className="admin-grid2">
          <label>
            Kontakt-E-Mail (Seite „Kontakt“)
            <input value={k.email} onChange={(e) => setK({ ...k, email: e.target.value })} />
          </label>
          {(['instagram', 'tiktok', 'whatsapp'] as const).map((key) => (
            <label key={key}>
              {key === 'instagram' ? 'Instagram' : key === 'tiktok' ? 'TikTok' : 'WhatsApp'}-Link
              <input value={k[key]} placeholder="https://…" onChange={(e) => setK({ ...k, [key]: e.target.value })} />
            </label>
          ))}
        </div>
        <span className="hint">Leere Felder werden im Shop nicht angezeigt.</span>
      </fieldset>

      <fieldset>
        <legend>Hinweise im Warenkorb und in E-Mails</legend>
        <div className="admin-grid2">
          <label>
            Steuerhinweis (DE)
            <input value={vat.de} onChange={(e) => setVat({ ...vat, de: e.target.value })} />
          </label>
          <label>
            Steuerhinweis (EN)
            <input value={vat.en} onChange={(e) => setVat({ ...vat, en: e.target.value })} />
          </label>
          <label>
            Verpackung & Versand (DE)
            <textarea value={pack.de} onChange={(e) => setPack({ ...pack, de: e.target.value })} />
          </label>
          <label>
            Verpackung & Versand (EN)
            <textarea value={pack.en} onChange={(e) => setPack({ ...pack, en: e.target.value })} />
          </label>
        </div>
        <span className="hint">Den Steuerhinweis (z. B. Kleinunternehmerregelung) mit der Steuerberatung abstimmen.</span>
      </fieldset>

      <div className="admin-savebar">
        <button className="btn" onClick={save} disabled={busy || !canSave}>
          {busy ? 'Speichere …' : 'Shop-Infos speichern'}
        </button>
        {!canSave && <span className="note">Speichern erst möglich, wenn Sanity verbunden ist.</span>}
        {res && (
          <div role="status" className={`admin-msg ${res.ok ? '' : 'err'}`}>
            {res.message}
            {res.errors && (
              <ul>
                {res.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
