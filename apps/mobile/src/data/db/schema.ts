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

/**
 * PRD §8.3 describes one `exercise` table holding both the ~80 seeded catalog rows (shared,
 * fixed UUIDs, never synced) and user-created custom ones (synced under entity `custom_exercise`
 * — see data/sync). Both live in this one local table; `isCustom` distinguishes them. Catalog
 * rows are inserted once at bootstrap (src/data/db/seed.ts) and never touch the outbox.
 */
export const exercise = sqliteTable('exercise', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  equipment: text('equipment'),
  isLowerBody: integer('is_lower_body').notNull(),
  repMin: integer('rep_min').notNull(),
  repMax: integer('rep_max').notNull(),
  restSeconds: integer('rest_seconds').notNull(),
  isCustom: integer('is_custom').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

/** Whole-record conflict unit (PRD: "last write wins for the whole record") — items stored as
 * an opaque JSON string rather than child rows, so there's nothing to merge piecemeal. */
export const workoutTemplate = sqliteTable('workout_template', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  itemsJson: text('items_json').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

export const scheduleEntry = sqliteTable('schedule_entry', {
  id: text('id').primaryKey(),
  weekday: integer('weekday').notNull().unique(),
  templateId: text('template_id'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

export const workoutSession = sqliteTable('workout_session', {
  id: text('id').primaryKey(),
  localDate: text('local_date').notNull(),
  templateId: text('template_id'),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

export const setEntry = sqliteTable('set_entry', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  setNo: integer('set_no').notNull(),
  weightKg: real('weight_kg').notNull(),
  reps: integer('reps').notNull(),
  rpe: real('rpe'),
  isWarmup: integer('is_warmup').notNull().default(0),
  completed: integer('completed').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

/** Singleton — exactly one live row per install, upserted by `profileRepository` (there is no
 * secondary unique key to enforce this locally beyond "check if a row exists before inserting"). */
export const profile = sqliteTable('profile', {
  id: text('id').primaryKey(),
  sex: text('sex').notNull(),
  birthDate: text('birth_date').notNull(),
  heightCm: real('height_cm').notNull(),
  lifestyleFactor: real('lifestyle_factor').notNull(),
  goal: text('goal').notNull(),
  rateKgPerWeek: real('rate_kg_per_week').notNull(),
  units: text('units').notNull(),
  timeZone: text('time_zone').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

/** Append-only history (PRD §8.3 `targets`) — a row is only ever inserted, never updated. */
export const target = sqliteTable('target', {
  id: text('id').primaryKey(),
  effectiveFrom: text('effective_from').notNull(),
  kcalRest: real('kcal_rest').notNull(),
  kcalTraining: real('kcal_training').notNull(),
  proteinG: real('protein_g').notNull(),
  fatG: real('fat_g').notNull(),
  carbG: real('carb_g').notNull(),
  waterMl: real('water_ml').notNull(),
  source: text('source').notNull(), // 'auto' | 'manual' | 'check-in'
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

/** Mirrors `exercise`'s shared-catalog-plus-user-rows shape (PRD §8.3 `food`) — seeded rows
 * (`isCustom=0`) never sync, custom rows (`isCustom=1`) sync as `custom_food`. */
export const food = sqliteTable('food', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  servingUnit: text('serving_unit').notNull(),
  servingG: real('serving_g').notNull(),
  kcal: real('kcal').notNull(),
  proteinG: real('protein_g').notNull(),
  carbG: real('carb_g').notNull(),
  fatG: real('fat_g').notNull(),
  isCustom: integer('is_custom').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

/** One override per food (PRD §8.3 `food_override`) — a user's edit to a seeded food's nutrition
 * values, without changing the shared catalog row itself. */
export const foodOverride = sqliteTable('food_override', {
  id: text('id').primaryKey(),
  foodId: text('food_id').notNull().unique(),
  kcal: real('kcal').notNull(),
  proteinG: real('protein_g').notNull(),
  carbG: real('carb_g').notNull(),
  fatG: real('fat_g').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

/** Whole-record conflict unit, same shape as `workoutTemplate` (PRD §8.3 `saved_meal`). */
export const savedMeal = sqliteTable('saved_meal', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  itemsJson: text('items_json').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

/** Append-mostly, same shape as `setEntry` (PRD §8.3 `food_entry`). `foodId` is null for a
 * quick-add entry, in which case `quickAddName`/`quickAddKcal`/`quickAddProteinG` carry the raw
 * values instead of resolving through the `food`/`foodOverride` tables. */
export const foodEntry = sqliteTable('food_entry', {
  id: text('id').primaryKey(),
  localDate: text('local_date').notNull(),
  mealSlot: text('meal_slot').notNull(), // 'breakfast' | 'lunch' | 'snacks' | 'dinner'
  foodId: text('food_id'),
  quickAddName: text('quick_add_name'),
  quickAddKcal: real('quick_add_kcal'),
  quickAddProteinG: real('quick_add_protein_g'),
  servings: real('servings').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

/** Append-mostly, same shape as `setEntry` (PRD §8.3 `water_entry`). */
export const waterEntry = sqliteTable('water_entry', {
  id: text('id').primaryKey(),
  localDate: text('local_date').notNull(),
  loggedAt: text('logged_at').notNull(),
  ml: real('ml').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  clientUpdatedAt: text('client_updated_at').notNull(),
  version: integer('version').notNull().default(0),
  serverSeq: integer('server_seq').notNull().default(0),
  deletedAt: text('deleted_at'),
});

export type WeightEntryRow = typeof weightEntry.$inferSelect;
export type OutboxRow = typeof outbox.$inferSelect;
export type SyncStateRow = typeof syncState.$inferSelect;
export type ExerciseRow = typeof exercise.$inferSelect;
export type WorkoutTemplateRow = typeof workoutTemplate.$inferSelect;
export type ScheduleEntryRow = typeof scheduleEntry.$inferSelect;
export type WorkoutSessionRow = typeof workoutSession.$inferSelect;
export type SetEntryRow = typeof setEntry.$inferSelect;
export type ProfileRow = typeof profile.$inferSelect;
export type TargetRow = typeof target.$inferSelect;
export type FoodRow = typeof food.$inferSelect;
export type FoodOverrideRow = typeof foodOverride.$inferSelect;
export type SavedMealRow = typeof savedMeal.$inferSelect;
export type FoodEntryRow = typeof foodEntry.$inferSelect;
export type WaterEntryRow = typeof waterEntry.$inferSelect;
