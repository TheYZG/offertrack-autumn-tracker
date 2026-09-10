import { getDatabase } from '@/db';
import { initialApplications } from '@/lib/initial-applications';
import { AuthError, requireAuthenticatedUser } from '@/lib/password-auth';
import {
  stageOptions,
  type ApplicationRecord,
  type CurrentStage,
} from '@/lib/applications';

const selectApplications = `
  SELECT
    id,
    company,
    portal_url AS portalUrl,
    applied_at AS appliedAt,
    checked_at AS checkedAt,
    CASE
      WHEN stage IN ('简历筛选', '测评', '笔试', '面试', 'Offer', '已结束') THEN stage
      WHEN stage IN ('待补充', '已投递') THEN '简历筛选'
      WHEN stage LIKE '%面%' THEN '面试'
      WHEN stage LIKE '%笔试%' THEN '笔试'
      WHEN stage LIKE '%测评%' THEN '测评'
      ELSE '简历筛选'
    END AS stage,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM application_records
  WHERE owner_user_id = ?
  ORDER BY
    applied_at ASC,
    CASE
      WHEN id GLOB 'app-[0-9]*' THEN CAST(SUBSTR(id, 5) AS INTEGER)
      ELSE 1000000
    END ASC,
    created_at ASC
`;

const initialAppliedDate = '2026-09-07';

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

function parseApplication(input: unknown, id?: string): ApplicationRecord {
  if (!input || typeof input !== 'object') {
    throw new Error('请求内容格式不正确');
  }

  const value = input as Record<string, unknown>;
  const company = typeof value.company === 'string' ? value.company.trim() : '';
  if (!company) throw new Error('请填写企业名');

  const stage = stageOptions.includes(value.stage as CurrentStage)
    ? (value.stage as CurrentStage)
    : '简历筛选';
  const now = new Date().toISOString();

  return {
    id: id ?? crypto.randomUUID(),
    company,
    stage,
    portalUrl:
      typeof value.portalUrl === 'string' ? value.portalUrl.trim() : '',
    appliedAt:
      typeof value.appliedAt === 'string' && value.appliedAt.trim()
        ? value.appliedAt.trim()
        : now.slice(0, 10),
    checkedAt:
      typeof value.checkedAt === 'string' ? value.checkedAt.trim() : '',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: now,
  };
}

function categoryForStage(stage: CurrentStage) {
  if (stage === '测评' || stage === '笔试') return '测评/笔试';
  if (stage === '面试') return '面试中';
  if (stage === 'Offer') return 'Offer';
  if (stage === '已结束') return '已结束';
  return '简历筛选';
}

function insertStatement(record: ApplicationRecord, ownerUserId: string) {
  return getDatabase()
    .prepare(
      `INSERT OR IGNORE INTO application_records (
        id, owner_user_id, company, portal_url, applied_at, checked_at, stage,
        stage_category, stage_status, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      record.id,
      ownerUserId,
      record.company,
      record.portalUrl,
      record.appliedAt,
      record.checkedAt,
      record.stage,
      categoryForStage(record.stage),
      '未开始',
      '中',
      record.createdAt,
      record.updatedAt,
    );
}

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const database = getDatabase();
    const count = await database
      .prepare(
        `SELECT COUNT(*) AS total
         FROM application_records
         WHERE owner_user_id = ?`,
      )
      .bind(user.id)
      .first<{ total: number }>();

    if (!count?.total) {
      const firstUser = await database
        .prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1')
        .first<{ id: string }>();
      if (firstUser?.id === user.id) {
        await database.batch(
          initialApplications.map((record) => insertStatement(record, user.id)),
        );
      }
    }

    await database
      .prepare(
        `UPDATE application_records
         SET applied_at = ?
         WHERE owner_user_id = ? AND applied_at = ''`,
      )
      .bind(initialAppliedDate, user.id)
      .run();

    await database
      .prepare(
        `UPDATE application_records
         SET stage = '简历筛选', stage_category = '简历筛选'
         WHERE owner_user_id = ? AND stage IN ('待补充', '已投递')`,
      )
      .bind(user.id)
      .run();

    const result = await database
      .prepare(selectApplications)
      .bind(user.id)
      .all<ApplicationRecord>();
    return json({ applications: result.results });
  } catch (error) {
    return requestError(error, '读取企业记录失败', 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const record = parseApplication(await request.json());
    await insertStatement(record, user.id).run();
    return json({ application: record }, 201);
  } catch (error) {
    return requestError(error, '新增企业失败', 400);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json();
    if (!body || typeof body !== 'object' || !('id' in body)) {
      throw new Error('缺少企业记录 ID');
    }
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) throw new Error('企业记录 ID 无效');

    const database = getDatabase();
    const existing = await database
      .prepare(
        `SELECT created_at AS createdAt
         FROM application_records
         WHERE id = ? AND owner_user_id = ?`,
      )
      .bind(id, user.id)
      .first<{ createdAt: string }>();
    if (!existing) return json({ error: '没有找到这条企业记录' }, 404);

    const record = parseApplication(
      { ...(body as Record<string, unknown>), createdAt: existing.createdAt },
      id,
    );
    await database
      .prepare(
        `UPDATE application_records SET
          company = ?, portal_url = ?, applied_at = ?, stage = ?, stage_category = ?, updated_at = ?
        WHERE id = ? AND owner_user_id = ?`,
      )
      .bind(
        record.company,
        record.portalUrl,
        record.appliedAt,
        record.stage,
        categoryForStage(record.stage),
        record.updatedAt,
        record.id,
        user.id,
      )
      .run();

    return json({ application: record });
  } catch (error) {
    return requestError(error, '保存修改失败', 400);
  }
}

export async function PATCH(request: Request) {
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
    const checkedAt =
      body &&
      typeof body === 'object' &&
      'checkedAt' in body &&
      typeof body.checkedAt === 'string'
        ? body.checkedAt
        : '';
    if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(checkedAt)) {
      throw new Error('更新日期无效');
    }

    const result = await getDatabase()
      .prepare(
        `UPDATE application_records
         SET checked_at = ?, updated_at = ?
         WHERE id = ? AND owner_user_id = ?`,
      )
      .bind(checkedAt, new Date().toISOString(), id, user.id)
      .run();
    if (!result.meta.changes) {
      return json({ error: '没有找到这条企业记录' }, 404);
    }
    return json({ id, checkedAt });
  } catch (error) {
    return requestError(error, '更新检查状态失败', 400);
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
    if (!id) throw new Error('企业记录 ID 无效');

    const result = await getDatabase()
      .prepare(
        'DELETE FROM application_records WHERE id = ? AND owner_user_id = ?',
      )
      .bind(id, user.id)
      .run();

    if (!result.meta.changes) {
      return json({ error: '没有找到这条企业记录' }, 404);
    }
    return json({ deletedId: id });
  } catch (error) {
    return requestError(error, '删除企业失败', 400);
  }
}
