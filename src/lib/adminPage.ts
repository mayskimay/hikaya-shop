import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySessionToken } from './adminAuth';

// Serverseitige Prüfung in jeder Admin-Seite (zusätzlich zur Middleware)
export async function requireAdminPage(): Promise<{ user: string }> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) redirect('/admin/login');
  return { user: session.u };
}
