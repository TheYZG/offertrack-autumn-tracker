import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const applicationRecords = sqliteTable(
  'application_records',
  {
    id: text('id').primaryKey(),
    company: text('company').notNull(),
    jobTitle: text('job_title').notNull().default(''),
    city: text('city').notNull().default(''),
    portalUrl: text('portal_url').notNull().default(''),
    appliedAt: text('applied_at').notNull().default(''),
    checkedAt: text('checked_at').notNull().default(''),
    deadlineAt: text('deadline_at').notNull().default(''),
    sourceStatus: text('source_status'),
    stage: text('stage').notNull(),
    stageCategory: text('stage_category').notNull(),
    stageStatus: text('stage_status').notNull(),
    nextAction: text('next_action').notNull().default(''),
    priority: text('priority').notNull(),
    notes: text('notes').notNull().default(''),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_application_records_updated_at').on(table.updatedAt)],
);
