import { getDatabase } from '@/db';
import {
  applications as initialApplications,
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
    CASE
      WHEN stage IN ('待补充', '已投递', '简历筛选', '测评', '笔试', '面试', 'Offer', '已结束') THEN stage
      WHEN stage LIKE '%面%' THEN '面试'
      WHEN stage LIKE '%笔试%' THEN '笔试'
      WHEN stage LIKE '%测评%' THEN '测评'
      ELSE '待补充'
    END AS stage,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM application_records
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

function parseApplication(input: unknown, id?: string): ApplicationRecord {
  if (!input || typeof input !== 'object') {
    throw new Error('请求内容格式不正确');
  }

  const value = input as Record<string, unknown>;
  const company = typeof value.company === 'string' ? value.company.trim() : '';
  if (!company) throw new Error('请填写企业名');

  const stage = stageOptions.includes(value.stage as CurrentStage)
    ? (value.stage as CurrentStage)
    : '待补充';
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
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: now,
  };
}

function categoryForStage(stage: CurrentStage) {
  if (stage === '测评' || stage === '笔试') return '测评/笔试';
  if (stage === '面试') return '面试中';
  if (stage === 'Offer') return 'Offer';
  if (stage === '已结束') return '已结束';
  if (stage === '待补充') return '待补充';
  return '简历筛选';
}

function insertStatement(record: ApplicationRecord) {
  return getDatabase()
    .prepare(
      `INSERT OR IGNORE INTO application_records (
        id, company, portal_url, applied_at, stage, stage_category, stage_status,
        priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      record.id,
      record.company,
      record.portalUrl,
      record.appliedAt,
      record.stage,
      categoryForStage(record.stage),
      '未开始',
      '中',
      record.createdAt,
      record.updatedAt,
    );
}

export async function GET() {
  try {
    const database = getDatabase();
    const count = await database
      .prepare('SELECT COUNT(*) AS total FROM application_records')
      .first<{ total: number }>();

    if (!count?.total) {
      await database.batch(initialApplications.map(insertStatement));
    }

    await database
      .prepare(
        `UPDATE application_records
         SET applied_at = ?
         WHERE applied_at = ''`,
      )
      .bind(initialAppliedDate)
      .run();

    const result = await database
      .prepare(selectApplications)
      .all<ApplicationRecord>();
    return json({ applications: result.results });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : '读取企业记录失败' },
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const record = parseApplication(await request.json());
    await insertStatement(record).run();
    return json({ application: record }, 201);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : '新增企业失败' },
      400,
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || !('id' in body)) {
      throw new Error('缺少企业记录 ID');
    }
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) throw new Error('企业记录 ID 无效');

    const database = getDatabase();
    const existing = await database
      .prepare(
        'SELECT created_at AS createdAt FROM application_records WHERE id = ?',
      )
      .bind(id)
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
        WHERE id = ?`,
      )
      .bind(
        record.company,
        record.portalUrl,
        record.appliedAt,
        record.stage,
        categoryForStage(record.stage),
        record.updatedAt,
        record.id,
      )
      .run();

    return json({ application: record });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : '保存修改失败' },
      400,
    );
  }
}
