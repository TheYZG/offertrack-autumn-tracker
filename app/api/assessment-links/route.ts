import { getDatabase } from '@/db';
import { AuthError, requireAuthenticatedUser } from '@/lib/password-auth';
import {
  assessmentLinkTypeOptions,
  type AssessmentLinkRecord,
  type AssessmentLinkType,
} from '@/lib/assessment-links';

const selectLinks = `
  SELECT
    id,
    company,
    type,
    title,
    url,
    notes,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM assessment_interview_links
  WHERE owner_user_id = ?
  ORDER BY updated_at DESC, created_at DESC
`;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function requestError(error: unknown, fallback: string, status: number) {
  return json(
    { error: error instanceof Error ? error.message : fallback },
    error instanceof AuthError ? error.status : status,
  );
}

function parseLink(input: unknown, id?: string): AssessmentLinkRecord {
  if (!input || typeof input !== 'object') {
    throw new Error('请求内容格式不正确');
  }

  const value = input as Record<string, unknown>;
  const company = typeof value.company === 'string' ? value.company.trim() : '';
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const rawUrl = typeof value.url === 'string' ? value.url.trim() : '';
  if (!company) throw new Error('请填写企业名');
  if (!title) throw new Error('请填写链接名称');
  if (!rawUrl) throw new Error('请填写网址');

  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  try {
    new URL(url);
  } catch {
    throw new Error('网址格式不正确');
  }

  const type = assessmentLinkTypeOptions.includes(value.type as AssessmentLinkType)
    ? (value.type as AssessmentLinkType)
    : '测评';
  const now = new Date().toISOString();

  return {
    id: id ?? crypto.randomUUID(),
    company,
    type,
    title,
    url,
    notes: typeof value.notes === 'string' ? value.notes.trim() : '',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: now,
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const result = await getDatabase()
      .prepare(selectLinks)
      .bind(user.id)
      .all<AssessmentLinkRecord>();
    return json({ links: result.results });
  } catch (error) {
    return requestError(error, '读取测评面试链接失败', 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const record = parseLink(await request.json());
    await getDatabase()
      .prepare(
        `INSERT INTO assessment_interview_links
          (id, owner_user_id, company, type, title, url, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        record.id,
        user.id,
        record.company,
        record.type,
        record.title,
        record.url,
        record.notes,
        record.createdAt,
        record.updatedAt,
      )
      .run();
    return json({ link: record }, 201);
  } catch (error) {
    return requestError(error, '新增链接失败', 400);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json();
    if (!body || typeof body !== 'object' || !('id' in body)) {
      throw new Error('缺少链接 ID');
    }
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) throw new Error('链接 ID 无效');

    const database = getDatabase();
    const existing = await database
      .prepare(
        `SELECT created_at AS createdAt
         FROM assessment_interview_links
         WHERE id = ? AND owner_user_id = ?`,
      )
      .bind(id, user.id)
      .first<{ createdAt: string }>();
    if (!existing) return json({ error: '没有找到这条链接' }, 404);

    const record = parseLink(
      { ...(body as Record<string, unknown>), createdAt: existing.createdAt },
      id,
    );
    await database
      .prepare(
        `UPDATE assessment_interview_links SET
          company = ?, type = ?, title = ?, url = ?, notes = ?, updated_at = ?
         WHERE id = ? AND owner_user_id = ?`,
      )
      .bind(
        record.company,
        record.type,
        record.title,
        record.url,
        record.notes,
        record.updatedAt,
        record.id,
        user.id,
      )
      .run();
    return json({ link: record });
  } catch (error) {
    return requestError(error, '保存链接失败', 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json();
    const id =
      body &&
      typeof body === 'object' &&
      'id' in body &&
      typeof body.id === 'string'
        ? body.id
        : '';
    if (!id) throw new Error('链接 ID 无效');

    const result = await getDatabase()
      .prepare(
        'DELETE FROM assessment_interview_links WHERE id = ? AND owner_user_id = ?',
      )
      .bind(id, user.id)
      .run();
    if (!result.meta.changes) return json({ error: '没有找到这条链接' }, 404);
    return json({ deletedId: id });
  } catch (error) {
    return requestError(error, '删除链接失败', 400);
  }
}
