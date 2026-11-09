import type { ReactNode } from 'react';

// Eigenes Grundgerüst für das CMS unter /studio
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
