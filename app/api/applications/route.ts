import { getDatabase } from '@/db';
import {
  applications as initialApplications,
  type ApplicationRecord,
  type StageCategory,
  type StageStatus,
} from '@/lib/applications';

const categories: StageCategory[] = [
  '简历筛选',
  '测评/笔试',
  '面试中',
  'Offer',
  '已结束',
  '待补充',
];
const statuses: StageStatus[] = [
  '未开始',
  '待处理',
  '进行中',
  '等待结果',
  '已通过',
  '未通过',
  '已跳过',
];
const priorities: ApplicationRecord['priority'][] = ['高', '中', '低'];

const selectApplications = `
  SELECT
    id,
    company,
    job_title AS jobTitle,
    city,
    portal_url AS portalUrl,
    applied_at AS appliedAt,
    deadline_at AS deadlineAt,
    source_status AS sourceStatus,
    stage,
    stage_category AS stageCategory,
    stage_status AS stageStatus,
    next_action AS nextAction,
    priority,
    notes,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM application_records
  ORDER BY updated_at DESC, company ASC
`;

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
  if (!company) throw new Error('请填写公司名称');

  const stageCategory = categories.includes(
    value.stageCategory as StageCategory,
  )
    ? (value.stageCategory as StageCategory)
    : '待补充';
  const stageStatus = statuses.includes(value.stageStatus as StageStatus)
    ? (value.stageStatus as StageStatus)
    : '未开始';
  const priority = priorities.includes(
    value.priority as ApplicationRecord['priority'],
  )
    ? (value.priority as ApplicationRecord['priority'])
    : '中';
  const now = new Date().toISOString();

  return {
    id: id ?? crypto.randomUUID(),
    company,
    jobTitle: typeof value.jobTitle === 'string' ? value.jobTitle.trim() : '',
    city: typeof value.city === 'string' ? value.city.trim() : '',
    portalUrl:
      typeof value.portalUrl === 'string' ? value.portalUrl.trim() : '',
    appliedAt:
      typeof value.appliedAt === 'string' ? value.appliedAt.trim() : '',
    deadlineAt:
      typeof value.deadlineAt === 'string' ? value.deadlineAt.trim() : '',
    sourceStatus:
      typeof value.sourceStatus === 'string' ? value.sourceStatus.trim() : null,
    stage:
      typeof value.stage === 'string' && value.stage.trim()
        ? value.stage.trim()
        : '待补充',
    stageCategory,
    stageStatus,
    nextAction:
      typeof value.nextAction === 'string' ? value.nextAction.trim() : '',
    priority,
    notes: typeof value.notes === 'string' ? value.notes.trim() : '',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: now,
  };
}

function insertStatement(record: ApplicationRecord) {
  return getDatabase()
    .prepare(
      `INSERT OR IGNORE INTO application_records (
        id, company, job_title, city, portal_url, applied_at, deadline_at, source_status,
        stage, stage_category, stage_status, next_action, priority, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      record.id,
      record.company,
      record.jobTitle,
      record.city,
      record.portalUrl,
      record.appliedAt,
      record.deadlineAt,
      record.sourceStatus,
      record.stage,
      record.stageCategory,
      record.stageStatus,
      record.nextAction,
      record.priority,
      record.notes,
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

    const result = await database
      .prepare(selectApplications)
      .all<ApplicationRecord>();
    return json({ applications: result.results });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : '读取投递记录失败' },
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
      { error: error instanceof Error ? error.message : '新增投递失败' },
      400,
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || !('id' in body)) {
      throw new Error('缺少投递记录 ID');
    }
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) throw new Error('投递记录 ID 无效');

    const database = getDatabase();
    const existing = await database
      .prepare(
        'SELECT created_at AS createdAt FROM application_records WHERE id = ?',
      )
      .bind(id)
      .first<{ createdAt: string }>();
    if (!existing) return json({ error: '没有找到这条投递记录' }, 404);

    const record = parseApplication(
      { ...(body as Record<string, unknown>), createdAt: existing.createdAt },
      id,
    );
    await database
      .prepare(
        `UPDATE application_records SET
          company = ?, job_title = ?, city = ?, portal_url = ?, applied_at = ?, deadline_at = ?,
          source_status = ?, stage = ?, stage_category = ?, stage_status = ?,
          next_action = ?, priority = ?, notes = ?, updated_at = ?
        WHERE id = ?`,
      )
      .bind(
        record.company,
        record.jobTitle,
        record.city,
        record.portalUrl,
        record.appliedAt,
        record.deadlineAt,
        record.sourceStatus,
        record.stage,
        record.stageCategory,
        record.stageStatus,
        record.nextAction,
        record.priority,
        record.notes,
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
