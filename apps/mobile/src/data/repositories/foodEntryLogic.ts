import type { FoodEntryRow, OutboxRow } from '../db/schema';

export type MealSlot = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

function buildPayload(entry: FoodEntryRow) {
  return {
    localDate: entry.localDate,
    mealSlot: entry.mealSlot,
    foodId: entry.foodId,
    quickAddName: entry.quickAddName,
    quickAddKcal: entry.quickAddKcal,
    quickAddProteinG: entry.quickAddProteinG,
    servings: entry.servings,
    clientUpdatedAt: entry.clientUpdatedAt,
  };
}

/** Pure logic behind `logEntry` (see foodEntryRepository.ts) — plain append, same shape as
 * `buildLogSetChange` (always a brand-new insert, never an update). */
export function buildLogFoodEntryChange(params: {
  localDate: string;
  mealSlot: MealSlot;
  foodId: string;
  servings: number;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: FoodEntryRow; outboxRow: OutboxRow } {
  const { localDate, mealSlot, foodId, servings, now, newId, newOpId } = params;

  const entry: FoodEntryRow = {
    id: newId,
    localDate,
    mealSlot,
    foodId,
    quickAddName: null,
    quickAddKcal: null,
    quickAddProteinG: null,
    servings,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'food_entry',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify(buildPayload(entry)),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}

/** Pure logic behind `quickAdd` — same table/entity as `logEntry`, `foodId` stays null and the
 * raw values travel in `quickAddName`/`quickAddKcal`/`quickAddProteinG` instead (PRD §3.4). */
export function buildQuickAddChange(params: {
  localDate: string;
  mealSlot: MealSlot;
  name: string;
  kcal: number;
  proteinG: number;
  servings: number;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: FoodEntryRow; outboxRow: OutboxRow } {
  const { localDate, mealSlot, name, kcal, proteinG, servings, now, newId, newOpId } = params;

  const entry: FoodEntryRow = {
    id: newId,
    localDate,
    mealSlot,
    foodId: null,
    quickAddName: name,
    quickAddKcal: kcal,
    quickAddProteinG: proteinG,
    servings,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'food_entry',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify(buildPayload(entry)),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
