// Gemeinsame Speicherfunktion für die Formulare im Verwaltungsbereich
export interface SaveResult {
  ok: boolean;
  message: string;
  errors?: string[];
}

export async function postJson(url: string, body: unknown): Promise<SaveResult & Record<string, unknown>> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 401) return { ok: false, message: 'Sitzung abgelaufen – bitte neu anmelden.' };
    if (!res.ok) return { ok: false, message: String(data.error ?? 'Fehler beim Speichern'), errors: data.errors as string[] | undefined };
    return { ...data, ok: true, message: 'Gespeichert.' };
  } catch {
    return { ok: false, message: 'Verbindungsfehler' };
  }
}
