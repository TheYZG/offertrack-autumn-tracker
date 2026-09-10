import { getDatabase } from '@/db';

const sessionCookieName = 'offertrack_session';
const passwordIterations = 100_000;
const rememberedSessionSeconds = 60 * 60 * 24 * 30;
const browserSessionSeconds = 60 * 60 * 24;

export interface LocalUser {
  id: string;
  username: string;
}

interface SessionResult {
  user: LocalUser;
  cookie: string;
  firstUser?: boolean;
}

interface Credentials {
  username: string;
  password: string;
  remember: boolean;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomToken() {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(32)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return bytesToBase64(new Uint8Array(digest));
}

async function derivePassword(password: string, salt: Uint8Array<ArrayBuffer>) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: passwordIterations,
    },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function sameBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function normalizeUsername(username: string) {
  return username.trim().normalize('NFKC');
}

function usernameKey(username: string) {
  return normalizeUsername(username).toLocaleLowerCase('zh-CN');
}

export function readCredentials(input: unknown): Credentials {
  if (!input || typeof input !== 'object') {
    throw new AuthError('请求内容格式不正确');
  }
  const value = input as Record<string, unknown>;
  const username = normalizeUsername(
    typeof value.username === 'string' ? value.username : '',
  );
  const password = typeof value.password === 'string' ? value.password : '';
  const remember = value.remember !== false;

  const usernameLength = Array.from(username).length;
  if (
    usernameLength < 3 ||
    usernameLength > 24 ||
    !/^[\p{L}\p{N}_-]+$/u.test(username)
  ) {
    throw new AuthError('账号需为 3–24 位文字、字母、数字、下划线或短横线');
  }
  if (password.length < 8 || password.length > 128) {
    throw new AuthError('密码需为 8–128 位');
  }
  return { username, password, remember };
}

function sessionCookie(token: string, remember: boolean) {
  const attributes = [
    `${sessionCookieName}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ];
  if (remember) attributes.push(`Max-Age=${rememberedSessionSeconds}`);
  return attributes.join('; ');
}

export function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function readSessionToken(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === sessionCookieName) return rest.join('=');
  }
  return '';
}

async function newSession(user: LocalUser, remember: boolean) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const now = new Date();
  const duration = remember ? rememberedSessionSeconds : browserSessionSeconds;
  const expiresAt = new Date(now.getTime() + duration * 1000).toISOString();
  return {
    user,
    cookie: sessionCookie(token, remember),
    statement: getDatabase()
      .prepare(
        `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(tokenHash, user.id, expiresAt, now.toISOString()),
  };
}

export async function registerUser(
  credentials: Credentials,
): Promise<SessionResult> {
  const database = getDatabase();
  const key = usernameKey(credentials.username);
  const existing = await database
    .prepare('SELECT id FROM users WHERE username_key = ?')
    .bind(key)
    .first<{ id: string }>();
  if (existing) throw new AuthError('这个账号已经存在', 409);

  const userCount = await database
    .prepare('SELECT COUNT(*) AS total FROM users')
    .first<{ total: number }>();
  const firstUser = !userCount?.total;
  const user: LocalUser = {
    id: crypto.randomUUID(),
    username: credentials.username,
  };
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await derivePassword(credentials.password, salt);
  const session = await newSession(user, credentials.remember);
  const statements = [
    database
      .prepare(
        `INSERT INTO users (
          id, username, username_key, password_hash, password_salt, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        user.id,
        user.username,
        key,
        bytesToBase64(passwordHash),
        bytesToBase64(salt),
        new Date().toISOString(),
      ),
  ];
  if (firstUser) {
    statements.push(
      database
        .prepare(
          `UPDATE application_records
           SET owner_user_id = ?
           WHERE owner_user_id = ''`,
        )
        .bind(user.id),
    );
  }
  statements.push(session.statement);

  try {
    await database.batch(statements);
  } catch {
    throw new AuthError('账号创建失败，请换一个账号名后重试', 409);
  }

  return {
    user,
    cookie: session.cookie,
    firstUser,
  };
}

export async function loginUser(
  credentials: Credentials,
): Promise<SessionResult> {
  const database = getDatabase();
  const stored = await database
    .prepare(
      `SELECT id, username, password_hash AS passwordHash,
              password_salt AS passwordSalt
       FROM users
       WHERE username_key = ?`,
    )
    .bind(usernameKey(credentials.username))
    .first<
      LocalUser & {
        passwordHash: string;
        passwordSalt: string;
      }
    >();

  if (!stored) throw new AuthError('账号或密码不正确', 401);
  const candidate = await derivePassword(
    credentials.password,
    base64ToBytes(stored.passwordSalt),
  );
  if (!sameBytes(candidate, base64ToBytes(stored.passwordHash))) {
    throw new AuthError('账号或密码不正确', 401);
  }

  await database
    .prepare('DELETE FROM sessions WHERE expires_at <= ?')
    .bind(new Date().toISOString())
    .run();
  const user = { id: stored.id, username: stored.username };
  const session = await newSession(user, credentials.remember);
  await session.statement.run();
  return { user, cookie: session.cookie };
}

export async function getAuthenticatedUser(request: Request) {
  const token = readSessionToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  return getDatabase()
    .prepare(
      `SELECT users.id, users.username
       FROM sessions
       INNER JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    )
    .bind(tokenHash, new Date().toISOString())
    .first<LocalUser>();
}

export async function requireAuthenticatedUser(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) throw new AuthError('请先登录', 401);
  return user;
}

export async function removeSession(request: Request) {
  const token = readSessionToken(request);
  if (!token) return;
  await getDatabase()
    .prepare('DELETE FROM sessions WHERE token_hash = ?')
    .bind(await sha256(token))
    .run();
}
