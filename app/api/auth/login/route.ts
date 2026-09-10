import { AuthError, loginUser, readCredentials } from '@/lib/password-auth';

export async function POST(request: Request) {
  try {
    const credentials = readCredentials(await request.json());
    const result = await loginUser(credentials);
    return Response.json(
      { user: result.user },
      {
        headers: {
          'Cache-Control': 'no-store',
          'Set-Cookie': result.cookie,
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : '登录失败，请稍后重试',
      },
      {
        status: error instanceof AuthError ? error.status : 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
