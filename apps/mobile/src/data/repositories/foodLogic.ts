import type { FoodOverrideRow, FoodRow, OutboxRow } from '../db/schema';

export type CustomFoodInput = {
  name: string;
  servingUnit: string;
  servingG: number;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
};

/** Pure logic behind `createCustomFood` (see foodRepository.ts) — mirrors
 * `buildCreateCustomExerciseChange`'s always-a-brand-new-insert shape exactly. */
export function buildCreateCustomFoodChange(params: {
  input: CustomFoodInput;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: FoodRow; outboxRow: OutboxRow } {
  const { input, now, newId, newOpId } = params;

  const entry: FoodRow = {
    id: newId,
    ...input,
    isCustom: 1,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'custom_food',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({ ...input, clientUpdatedAt: now }),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}

export type FoodOverrideInput = { kcal: number; proteinG: number; carbG: number; fatG: number };

/** Pure logic behind `setFoodOverride` — upsert-by-unique-key, same shape as
 * `buildSetScheduleDayChange` (keyed by `foodId` instead of weekday). */
export function buildSetFoodOverrideChange(params: {
  existing: FoodOverrideRow | null;
  foodId: string;
  values: FoodOverrideInput;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: FoodOverrideRow; outboxRow: OutboxRow } {
  const { existing, foodId, values, now, newId, newOpId } = params;

  const entry: FoodOverrideRow = existing
    ? { ...existing, ...values, updatedAt: now, clientUpdatedAt: now }
    : {
        id: newId,
        foodId,
        ...values,
        createdAt: now,
        updatedAt: now,
        clientUpdatedAt: now,
        version: 0,
        serverSeq: 0,
        deletedAt: null,
      };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'food_override',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({ foodId, ...values, clientUpdatedAt: entry.clientUpdatedAt }),
    baseVersion: existing ? existing.version : null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
