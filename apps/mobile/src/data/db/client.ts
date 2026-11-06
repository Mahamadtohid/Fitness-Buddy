import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import * as schema from './schema';

export const SYNC_STATE_SINGLETON_ID = 'singleton';

/**
 * Hand-written idempotent bootstrap instead of the drizzle-kit generate + Metro/Babel migrator
 * pipeline: that pipeline needs a device/emulator to prove migrations actually run (bundling
 * alone doesn't verify it), which isn't available in this environment. Drizzle is still used as
 * the query builder against this schema — only the migration *tooling* is simplified for now.
 * Swap in drizzle-kit migrations once there's a real schema history to manage.
 */
const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS weight_entry (
  id TEXT PRIMARY KEY NOT NULL,
  local_date TEXT NOT NULL UNIQUE,
  weight_kg REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS outbox (
  op_id TEXT PRIMARY KEY NOT NULL,
  entity TEXT NOT NULL,
  record_id TEXT NOT NULL,
  op TEXT NOT NULL,
  payload TEXT NOT NULL,
  base_version INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_state (
  id TEXT PRIMARY KEY NOT NULL,
  last_cursor INTEGER NOT NULL DEFAULT 0,
  last_synced_at TEXT
);

INSERT INTO sync_state (id, last_cursor, last_synced_at)
SELECT '${SYNC_STATE_SINGLETON_ID}', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM sync_state);
`;

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function openAndBootstrap(name: string): SQLiteDatabase {
  const instance = openDatabaseSync(name);
  instance.execSync(BOOTSTRAP_SQL);
  return instance;
}

export function getDb() {
  if (!db) {
    db = drizzle(openAndBootstrap('fitness-companion.db'), { schema });
  }
  return db;
}
