import { clearSessionCookie, sameOrigin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response('Anfrage abgelehnt', { status: 403 });
  const secure = new URL(req.url).protocol === 'https:';
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL('/admin/login?e=out', req.url).toString(),
      'Set-Cookie': clearSessionCookie(secure),
      'Cache-Control': 'no-store',
    },
  });
}
