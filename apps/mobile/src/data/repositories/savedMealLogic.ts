import type { OutboxRow, SavedMealRow } from '../db/schema';

export type SavedMealItem = { foodId: string; servings: number };

/** Pure logic behind `create` (see savedMealRepository.ts) — mirrors
 * `buildCreateTemplateChange`'s whole-record-JSON-items shape exactly. */
export function buildCreateSavedMealChange(params: {
  name: string;
  items: SavedMealItem[];
  now: string;
  newId: string;
  newOpId: string;
}): { entry: SavedMealRow; outboxRow: OutboxRow } {
  const { name, items, now, newId, newOpId } = params;
  const itemsJson = JSON.stringify(items);

  const entry: SavedMealRow = {
    id: newId,
    name,
    itemsJson,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'saved_meal',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({ name, itemsJson, clientUpdatedAt: now }),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
