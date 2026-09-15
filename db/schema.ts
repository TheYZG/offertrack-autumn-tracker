import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    username: text('username').notNull(),
    usernameKey: text('username_key').notNull(),
    passwordHash: text('password_hash').notNull(),
    passwordSalt: text('password_salt').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_users_username_key').on(table.usernameKey)],
);

export const sessions = sqliteTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id').notNull(),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_sessions_user_id').on(table.userId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ],
);

export const applicationRecords = sqliteTable(
  'application_records',
  {
    id: text('id').primaryKey(),
    ownerUserId: text('owner_user_id').notNull().default(''),
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
  (table) => [
    index('idx_application_records_owner_applied_at').on(
      table.ownerUserId,
      table.appliedAt,
    ),
    index('idx_application_records_updated_at').on(table.updatedAt),
  ],
);

export const assessmentInterviewLinks = sqliteTable(
  'assessment_interview_links',
  {
    id: text('id').primaryKey(),
    ownerUserId: text('owner_user_id').notNull(),
    company: text('company').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    notes: text('notes').notNull().default(''),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_assessment_links_owner_updated').on(
      table.ownerUserId,
      table.updatedAt,
    ),
  ],
);
