import type { OutboxRow, WorkoutTemplateRow } from '../db/schema';

export type TemplateItem = { exerciseId: string; setCount: number; order: number };

export function buildCreateTemplateChange(params: {
  name: string;
  items: TemplateItem[];
  now: string;
  newId: string;
  newOpId: string;
}): { entry: WorkoutTemplateRow; outboxRow: OutboxRow } {
  const { name, items, now, newId, newOpId } = params;
  const itemsJson = JSON.stringify(items);

  const entry: WorkoutTemplateRow = {
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
    entity: 'workout_template',
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
