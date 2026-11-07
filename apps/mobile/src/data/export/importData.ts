import { eq } from 'drizzle-orm';

import { getDb } from '../db/client';
import {
  checkIn,
  exercise,
  food,
  foodEntry,
  foodOverride,
  measurement,
  outbox,
  profile,
  savedMeal,
  scheduleEntry,
  setEntry,
  target,
  waterEntry,
  weightEntry,
  workoutSession,
  workoutTemplate,
} from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';

const TABLES: Record<string, any> = {
  weightEntry,
  exercise,
  workoutTemplate,
  scheduleEntry,
  workoutSession,
  setEntry,
  profile,
  target,
  food,
  foodOverride,
  savedMeal,
  foodEntry,
  waterEntry,
  measurement,
  checkIn,
};

/** The wire entity name each table syncs under (see `data/sync/*Apply.ts` and the backend's
 * `SyncEndpoints.cs` for the matching contract). */
const ENTITY_NAMES: Record<string, string> = {
  weightEntry: 'weight_entry',
  exercise: 'custom_exercise',
  workoutTemplate: 'workout_template',
  scheduleEntry: 'schedule',
  workoutSession: 'workout_session',
  setEntry: 'set_entry',
  profile: 'profile',
  target: 'targets',
  food: 'custom_food',
  foodOverride: 'food_override',
  savedMeal: 'saved_meal',
  foodEntry: 'food_entry',
  waterEntry: 'water_entry',
  measurement: 'measurement',
  checkIn: 'check_in',
};

/** Builds the outbox payload for a re-imported row, matching each entity's exact wire contract
 * (same field names `pushApply.ts`'s `decide*PushResult` functions expect back). */
const PAYLOAD_BUILDERS: Record<string, (row: Record<string, any>) => Record<string, unknown>> = {
  weightEntry: (r) => ({ localDate: r.localDate, weightKg: r.weightKg, clientUpdatedAt: r.clientUpdatedAt }),
  exercise: (r) => ({
    name: r.name,
    muscleGroup: r.muscleGroup,
    equipment: r.equipment,
    isLowerBody: !!r.isLowerBody,
    repMin: r.repMin,
    repMax: r.repMax,
    restSeconds: r.restSeconds,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
  workoutTemplate: (r) => ({ name: r.name, itemsJson: r.itemsJson, clientUpdatedAt: r.clientUpdatedAt }),
  scheduleEntry: (r) => ({ weekday: r.weekday, templateId: r.templateId, clientUpdatedAt: r.clientUpdatedAt }),
  workoutSession: (r) => ({
    localDate: r.localDate,
    templateId: r.templateId,
    startedAt: r.startedAt,
    endedAt: r.endedAt,
    notes: r.notes,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
  setEntry: (r) => ({
    sessionId: r.sessionId,
    exerciseId: r.exerciseId,
    setNo: r.setNo,
    weightKg: r.weightKg,
    reps: r.reps,
    rpe: r.rpe,
    isWarmup: !!r.isWarmup,
    completed: !!r.completed,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
  profile: (r) => ({
    sex: r.sex,
    birthDate: r.birthDate,
    heightCm: r.heightCm,
    lifestyleFactor: r.lifestyleFactor,
    goal: r.goal,
    rateKgPerWeek: r.rateKgPerWeek,
    units: r.units,
    timeZone: r.timeZone,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
  target: (r) => ({
    effectiveFrom: r.effectiveFrom,
    kcalRest: r.kcalRest,
    kcalTraining: r.kcalTraining,
    proteinG: r.proteinG,
    fatG: r.fatG,
    carbG: r.carbG,
    waterMl: r.waterMl,
    source: r.source,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
  food: (r) => ({
    name: r.name,
    servingUnit: r.servingUnit,
    servingG: r.servingG,
    kcal: r.kcal,
    proteinG: r.proteinG,
    carbG: r.carbG,
    fatG: r.fatG,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
  foodOverride: (r) => ({
    foodId: r.foodId,
    kcal: r.kcal,
    proteinG: r.proteinG,
    carbG: r.carbG,
    fatG: r.fatG,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
  savedMeal: (r) => ({ name: r.name, itemsJson: r.itemsJson, clientUpdatedAt: r.clientUpdatedAt }),
  foodEntry: (r) => ({
    localDate: r.localDate,
    mealSlot: r.mealSlot,
    foodId: r.foodId,
    quickAddName: r.quickAddName,
    quickAddKcal: r.quickAddKcal,
    quickAddProteinG: r.quickAddProteinG,
    servings: r.servings,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
  waterEntry: (r) => ({ localDate: r.localDate, loggedAt: r.loggedAt, ml: r.ml, clientUpdatedAt: r.clientUpdatedAt }),
  measurement: (r) => ({
    localDate: r.localDate,
    type: r.type,
    valueCm: r.valueCm,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
  checkIn: (r) => ({
    weekStart: r.weekStart,
    trendChange: r.trendChange,
    suggestedKcal: r.suggestedKcal,
    decision: r.decision,
    clientUpdatedAt: r.clientUpdatedAt,
  }),
};

/** Rows that should never be re-imported even though `exportToJson` may have included them:
 * catalog (non-custom) exercise/food rows are shared reference data, already seeded locally, and
 * were never meant to sync under `custom_exercise`/`custom_food`; a `pending` check-in is a local
 * draft that was deliberately never pushed (see `checkInRepository.ts`) and importing it as-is
 * would incorrectly push it. */
function shouldImportRow(tableName: string, row: Record<string, any>): boolean {
  if ((tableName === 'exercise' || tableName === 'food') && row.isCustom !== 1) return false;
  if (tableName === 'checkIn' && row.decision === 'pending') return false;
  return true;
}

/**
 * Re-inserts previously-exported rows and enqueues one outbox op per row under that entity's own
 * name/payload contract — the exact same contract every live write already uses (see
 * `pushApply.ts`), so imported data syncs correctly.
 *
 * This deliberately does NOT go through each entity's high-level convenience function (e.g.
 * `logWeight`) — those always mint a fresh id/timestamp for a brand-new record, but import is a
 * *restore*: it preserves the original id and every stored field exactly as exported, then pushes
 * it as if freshly created locally (`baseVersion: null`) so the server's own conflict rules
 * reconcile it against whatever else exists remotely.
 *
 * Id-collision policy: if a row with the same id already exists locally, it is skipped (not
 * overwritten) — re-importing the same export file is then a safe no-op rather than clobbering
 * newer local edits made since the export was taken.
 */
export function importFromJson(json: Record<string, unknown>): void {
  const db = getDb();
  const now = new Date().toISOString();

  for (const [tableName, rows] of Object.entries(json)) {
    const table = TABLES[tableName];
    const buildPayload = PAYLOAD_BUILDERS[tableName];
    const entityName = ENTITY_NAMES[tableName];
    if (!table || !buildPayload || !entityName || !Array.isArray(rows)) continue;

    for (const row of rows as Record<string, any>[]) {
      if (!shouldImportRow(tableName, row)) continue;

      const id = row.id as string;
      const alreadyExists = db.select({ id: table.id }).from(table).where(eq(table.id, id)).limit(1).all().length > 0;
      if (alreadyExists) continue;

      db.insert(table).values(row).run();
      db.insert(outbox)
        .values({
          opId: generateId(),
          entity: entityName,
          recordId: id,
          op: 'upsert',
          payload: JSON.stringify(buildPayload(row)),
          baseVersion: null,
          attempts: 0,
          lastError: null,
          createdAt: now,
        })
        .run();
    }
  }

  notifyLocalWrite();
}
