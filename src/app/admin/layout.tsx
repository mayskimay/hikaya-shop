import type { ReactNode } from 'react';
import '../globals.css';

// Eigenes Grundgerüst für die Versand-Seite (nur für die Inhaberin, passwortgeschützt)
export const metadata = { robots: { index: false, follow: false }, title: 'Hikaya – Versand' };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
