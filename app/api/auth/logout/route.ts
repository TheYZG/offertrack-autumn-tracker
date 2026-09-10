import { clearSessionCookie, removeSession } from '@/lib/password-auth';

export async function POST(request: Request) {
  try {
    await removeSession(request);
  } catch {
    // The browser session is cleared even if server-side cleanup is unavailable.
  }
  return Response.json(
    { success: true },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Set-Cookie': clearSessionCookie(),
      },
    },
  );
}
