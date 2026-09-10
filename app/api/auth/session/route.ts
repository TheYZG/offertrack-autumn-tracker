import { getAuthenticatedUser } from '@/lib/password-auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    return Response.json(
      { user },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { error: '暂时无法检查登录状态' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
