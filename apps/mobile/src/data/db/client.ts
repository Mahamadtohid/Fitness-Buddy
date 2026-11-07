import { drizzle } from 'drizzle-orm/expo-sqlite';
import { deleteDatabaseSync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import * as schema from './schema';
import { SEED_EXERCISES } from './seedExercises';
import { SEED_FOODS } from './seedFoods';

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

CREATE TABLE IF NOT EXISTS exercise (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  is_lower_body INTEGER NOT NULL,
  rep_min INTEGER NOT NULL,
  rep_max INTEGER NOT NULL,
  rest_seconds INTEGER NOT NULL,
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS workout_template (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  items_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS schedule_entry (
  id TEXT PRIMARY KEY NOT NULL,
  weekday INTEGER NOT NULL UNIQUE,
  template_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS workout_session (
  id TEXT PRIMARY KEY NOT NULL,
  local_date TEXT NOT NULL,
  template_id TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS set_entry (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  set_no INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  reps INTEGER NOT NULL,
  rpe REAL,
  is_warmup INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY NOT NULL,
  sex TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  height_cm REAL NOT NULL,
  lifestyle_factor REAL NOT NULL,
  goal TEXT NOT NULL,
  rate_kg_per_week REAL NOT NULL,
  units TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS target (
  id TEXT PRIMARY KEY NOT NULL,
  effective_from TEXT NOT NULL,
  kcal_rest REAL NOT NULL,
  kcal_training REAL NOT NULL,
  protein_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  carb_g REAL NOT NULL,
  water_ml REAL NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS food (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  serving_unit TEXT NOT NULL,
  serving_g REAL NOT NULL,
  kcal REAL NOT NULL,
  protein_g REAL NOT NULL,
  carb_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS food_override (
  id TEXT PRIMARY KEY NOT NULL,
  food_id TEXT NOT NULL UNIQUE,
  kcal REAL NOT NULL,
  protein_g REAL NOT NULL,
  carb_g REAL NOT NULL,
  fat_g REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS saved_meal (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  items_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS food_entry (
  id TEXT PRIMARY KEY NOT NULL,
  local_date TEXT NOT NULL,
  meal_slot TEXT NOT NULL,
  food_id TEXT,
  quick_add_name TEXT,
  quick_add_kcal REAL,
  quick_add_protein_g REAL,
  servings REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS water_entry (
  id TEXT PRIMARY KEY NOT NULL,
  local_date TEXT NOT NULL,
  logged_at TEXT NOT NULL,
  ml REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS measurement (
  id TEXT PRIMARY KEY NOT NULL,
  local_date TEXT NOT NULL,
  type TEXT NOT NULL,
  value_cm REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS check_in (
  id TEXT PRIMARY KEY NOT NULL,
  week_start TEXT NOT NULL UNIQUE,
  trend_change REAL NOT NULL,
  suggested_kcal REAL NOT NULL,
  decision TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  client_updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0,
  server_seq INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS photo (
  id TEXT PRIMARY KEY NOT NULL,
  local_date TEXT NOT NULL,
  pose TEXT NOT NULL,
  file_path TEXT NOT NULL
);
`;

const DB_NAME = 'fitness-companion.db';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let rawInstance: SQLiteDatabase | null = null;

function openAndBootstrap(name: string): SQLiteDatabase {
  const instance = openDatabaseSync(name);
  instance.execSync(BOOTSTRAP_SQL);
  return instance;
}

/**
 * One-time catalog seed — plain inserts, no outbox: this is shared reference data, not a
 * user-owned record, so it never syncs (see schema.ts's `exercise` table comment). Deliberately
 * kept in this module (rather than importing a repository) so `client.ts` has no dependency on
 * `src/data/repositories`, avoiding a client<->repository import cycle.
 */
function seedExerciseCatalogIfEmpty(instance: ReturnType<typeof drizzle<typeof schema>>): void {
  const existing = instance.select({ id: schema.exercise.id }).from(schema.exercise).limit(1).all();
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  instance
    .insert(schema.exercise)
    .values(
      SEED_EXERCISES.map((seed) => ({
        id: seed.id,
        name: seed.name,
        muscleGroup: seed.muscleGroup,
        equipment: seed.equipment,
        isLowerBody: seed.isLowerBody ? 1 : 0,
        repMin: seed.repMin,
        repMax: seed.repMax,
        restSeconds: seed.restSeconds,
        isCustom: 0,
        createdAt: now,
        updatedAt: now,
        clientUpdatedAt: now,
        version: 0,
        serverSeq: 0,
        deletedAt: null,
      })),
    )
    .run();
}

/** Twin of `seedExerciseCatalogIfEmpty` — same reasoning (shared reference data, never syncs). */
function seedFoodCatalogIfEmpty(instance: ReturnType<typeof drizzle<typeof schema>>): void {
  const existing = instance.select({ id: schema.food.id }).from(schema.food).limit(1).all();
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  instance
    .insert(schema.food)
    .values(
      SEED_FOODS.map((seed) => ({
        id: seed.id,
        name: seed.name,
        servingUnit: seed.servingUnit,
        servingG: seed.servingG,
        kcal: seed.kcal,
        proteinG: seed.proteinG,
        carbG: seed.carbG,
        fatG: seed.fatG,
        isCustom: 0,
        createdAt: now,
        updatedAt: now,
        clientUpdatedAt: now,
        version: 0,
        serverSeq: 0,
        deletedAt: null,
      })),
    )
    .run();
}

export function getDb() {
  if (!db) {
    rawInstance = openAndBootstrap(DB_NAME);
    db = drizzle(rawInstance, { schema });
    seedExerciseCatalogIfEmpty(db);
    seedFoodCatalogIfEmpty(db);
  }
  return db;
}

/**
 * Wipes every local table (PRD §7.9: account deletion must wipe local data on the device, not
 * just the server side) and clears the cached connection so the next `getDb()` call reopens a
 * fresh database and reseeds the shared catalogs from scratch — the same state a brand-new
 * install would have. Closes the existing connection first so the delete isn't blocked by an open
 * handle.
 */
export function resetLocalDatabase(): void {
  try {
    rawInstance?.closeSync();
  } catch {
    // Already closed or never opened — fine, we're about to delete the file regardless.
  }
  rawInstance = null;
  db = null;

  try {
    deleteDatabaseSync(DB_NAME);
  } catch {
    // No existing database file (e.g. called before anything was ever logged) — nothing to delete.
  }
}
