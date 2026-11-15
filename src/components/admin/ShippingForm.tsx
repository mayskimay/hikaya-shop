'use client';

import { useState } from 'react';
import { postJson } from './save';
import type { Parcel, Zone } from '@/lib/settings';

interface ZoneDraft {
  id: string;
  labelDe: string;
  labelEn: string;
  countries: string;
  amount: string;
  freeFrom: string;
  deliveryDe: string;
  deliveryEn: string;
  carrier: 'standard' | 'dhl-express';
  dhlProductCode: string;
}

const toDraft = (z: Zone): ZoneDraft => ({
  id: z.id,
  labelDe: z.label.de,
  labelEn: z.label.en,
  countries: z.countries.join(', '),
  amount: String(z.amount),
  freeFrom: z.freeFrom !== undefined ? String(z.freeFrom) : '',
  deliveryDe: z.delivery.de,
  deliveryEn: z.delivery.en,
  carrier: z.carrier,
  dhlProductCode: z.dhlProductCode ?? '',
});

const num = (s: string) => (s.trim() === '' ? '' : Number(s.replace(',', '.')));

export default function ShippingForm({ zones, parcel, canSave, dhlConnected }: { zones: Zone[]; parcel: Parcel; canSave: boolean; dhlConnected: boolean }) {
  const [list, setList] = useState<ZoneDraft[]>(zones.map(toDraft));
  const [p, setP] = useState({
    packagingWeightG: String(parcel.packagingWeightG),
    defaultItemWeightG: String(parcel.defaultItemWeightG),
    lengthCm: String(parcel.lengthCm),
    widthCm: String(parcel.widthCm),
    heightCm: String(parcel.heightCm),
  });
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; message: string; errors?: string[] } | null>(null);

  const update = (i: number, patch: Partial<ZoneDraft>) => setList(list.map((z, j) => (j === i ? { ...z, ...patch } : z)));

  async function save() {
    setBusy(true);
    setRes(null);
    const r = await postJson('/admin/api/settings', {
      type: 'shipping',
      data: {
        zones: list.map((z) => ({
          id: z.id,
          label: { de: z.labelDe, en: z.labelEn },
          countries: z.countries.split(/[\s,;]+/).filter(Boolean),
          amount: num(z.amount),
          freeFrom: num(z.freeFrom),
          delivery: { de: z.deliveryDe, en: z.deliveryEn },
          carrier: z.carrier,
          dhlProductCode: z.carrier === 'dhl-express' ? z.dhlProductCode : '',
        })),
        parcel: Object.fromEntries(Object.entries(p).map(([k, v]) => [k, num(v)])),
      },
    });
    setBusy(false);
    setRes(r);
  }

  return (
    <div className="admin-form">
      {list.map((z, i) => (
        <fieldset key={i}>
          <legend>{z.labelDe || `Neue Zone ${i + 1}`}</legend>
          <div className="admin-grid2">
            <label>
              Name (DE)
              <input value={z.labelDe} onChange={(e) => update(i, { labelDe: e.target.value })} />
            </label>
            <label>
              Name (EN)
              <input value={z.labelEn} onChange={(e) => update(i, { labelEn: e.target.value })} />
            </label>
            <label>
              Kennung
              <input value={z.id} onChange={(e) => update(i, { id: e.target.value.toLowerCase() })} />
              <span className="hint">nur a–z, 0–9, - (z. B. at, eu)</span>
            </label>
            <label>
              Länder
              <input value={z.countries} onChange={(e) => update(i, { countries: e.target.value.toUpperCase() })} />
              <span className="hint">Ländercodes mit Komma, z. B. AT oder DE, IT, FR</span>
            </label>
            <label>
              Versandkosten (€)
              <input inputMode="decimal" value={z.amount} onChange={(e) => update(i, { amount: e.target.value })} />
            </label>
            <label>
              Gratis ab Warenwert (€)
              <input inputMode="decimal" value={z.freeFrom} onChange={(e) => update(i, { freeFrom: e.target.value })} />
              <span className="hint">leer = nie gratis</span>
            </label>
            <label>
              Lieferzeit (DE)
              <input value={z.deliveryDe} onChange={(e) => update(i, { deliveryDe: e.target.value })} />
            </label>
            <label>
              Lieferzeit (EN)
              <input value={z.deliveryEn} onChange={(e) => update(i, { deliveryEn: e.target.value })} />
            </label>
            <label>
              Lieferdienst
              <select value={z.carrier} onChange={(e) => update(i, { carrier: e.target.value as ZoneDraft['carrier'] })}>
                <option value="standard">Standardversand (ohne Anbindung)</option>
                <option value="dhl-express">DHL Express (angebunden)</option>
              </select>
              <span className="hint">
                {z.carrier === 'dhl-express' && !dhlConnected
                  ? 'DHL ist noch nicht live verbunden – Kundinnen sehen „Standardversand“.'
                  : 'Kundinnen sehen „DHL Express“ nur, wenn DHL live verbunden ist.'}
              </span>
            </label>
            {z.carrier === 'dhl-express' && (
              <label>
                Automatisches DHL-Etikett
                <select value={z.dhlProductCode} onChange={(e) => update(i, { dhlProductCode: e.target.value })}>
                  <option value="">keins (Etikett im DHL-Portal erstellen)</option>
                  <option value="N">N – Domestic Express (innerhalb AT)</option>
                  <option value="U">U – Express Worldwide (EU)</option>
                </select>
                <span className="hint">Muss in deinem DHL-Vertrag freigeschaltet sein. Nicht-EU (Zoll) bitte im Portal.</span>
              </label>
            )}
          </div>
          <p style={{ margin: '10px 0 0' }}>
            <button type="button" className="link-btn" onClick={() => setList(list.filter((_, j) => j !== i))} disabled={list.length <= 1}>
              Zone entfernen
            </button>
          </p>
        </fieldset>
      ))}
      <p>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() =>
            setList([...list, { id: '', labelDe: '', labelEn: '', countries: '', amount: '', freeFrom: '', deliveryDe: '', deliveryEn: '', carrier: 'standard', dhlProductCode: '' }])
          }
        >
          + Versandzone hinzufügen
        </button>
      </p>

      <fieldset>
        <legend>Paket (für Versandetiketten)</legend>
        <div className="admin-grid2">
          {(
            [
              ['packagingWeightG', 'Gewicht Verpackung (g)'],
              ['defaultItemWeightG', 'Standardgewicht je Artikel (g)'],
              ['lengthCm', 'Länge (cm)'],
              ['widthCm', 'Breite (cm)'],
              ['heightCm', 'Höhe (cm)'],
            ] as const
          ).map(([k, label]) => (
            <label key={k}>
              {label}
              <input inputMode="numeric" value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <span className="hint">Das Gewicht je Produkt trägst du im Editor beim Produkt ein; ohne Angabe gilt das Standardgewicht.</span>
      </fieldset>

      <div className="admin-savebar">
        <button className="btn" onClick={save} disabled={busy || !canSave}>
          {busy ? 'Speichere …' : 'Versand speichern'}
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
