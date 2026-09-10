import { AuthError, readCredentials, registerUser } from '@/lib/password-auth';

export async function POST(request: Request) {
  try {
    const credentials = readCredentials(await request.json());
    const result = await registerUser(credentials);
    return Response.json(
      { user: result.user, firstUser: result.firstUser },
      {
        status: 201,
        headers: {
          'Cache-Control': 'no-store',
          'Set-Cookie': result.cookie,
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : '账号创建失败，请稍后重试',
      },
      {
        status: error instanceof AuthError ? error.status : 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
