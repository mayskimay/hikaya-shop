import type { ReactNode } from 'react';
import { requireAdminPage } from '@/lib/adminPage';
import AdminNav from '@/components/admin/AdminNav';

// Grundgerüst des Verwaltungsbereichs. Die Anmeldung wird hier serverseitig erneut geprüft.
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAdminPage();
  return (
    <div className="admin-shell">
      <AdminNav user={user} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
