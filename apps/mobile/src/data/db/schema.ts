import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Local-only tables (PRD §7.2 src/data/db, §8). There is exactly one user per device in v1, so
 * unlike the server tables these have no user_id column — isolation is per-install, not per-row.
 */
export const weightEntry = sqliteTable('weight_entry', {
  id: text('id').primaryKey(),
  localDate: text('local_date').notNull().unique(),
  weightKg: real('weight_kg').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

export const outbox = sqliteTable('outbox', {
  opId: text('op_id').primaryKey(),
  entity: text('entity').notNull(),
  recordId: text('record_id').notNull(),
  op: text('op').notNull(), // 'upsert' | 'delete'
  payload: text('payload').notNull(), // JSON-serialized
  baseVersion: integer('base_version'),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  createdAt: text('created_at').notNull(),
});

export const syncState = sqliteTable('sync_state', {
  id: text('id').primaryKey(),
  lastCursor: integer('last_cursor').notNull().default(0),
  lastSyncedAt: text('last_synced_at'),
});

export type WeightEntryRow = typeof weightEntry.$inferSelect;
export type OutboxRow = typeof outbox.$inferSelect;
export type SyncStateRow = typeof syncState.$inferSelect;
