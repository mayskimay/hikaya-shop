import type { ReactNode } from 'react';
import '../globals.css';

// Eigenes Grundgerüst für den Verwaltungsbereich (nur für die Inhaberin, mit Anmeldung)
export const metadata = { robots: { index: false, follow: false }, title: 'Hikaya – Verwaltung' };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
