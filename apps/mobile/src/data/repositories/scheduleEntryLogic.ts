import type { OutboxRow, ScheduleEntryRow } from '../db/schema';

/** Mirrors `buildLogWeightChange`'s upsert-by-unique-key shape — one row per weekday. */
export function buildSetScheduleDayChange(params: {
  existing: ScheduleEntryRow | null;
  weekday: number;
  templateId: string | null;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: ScheduleEntryRow; outboxRow: OutboxRow } {
  const { existing, weekday, templateId, now, newId, newOpId } = params;

  const entry: ScheduleEntryRow = existing
    ? { ...existing, templateId, updatedAt: now, clientUpdatedAt: now }
    : {
        id: newId,
        weekday,
        templateId,
        createdAt: now,
        updatedAt: now,
        clientUpdatedAt: now,
        version: 0,
        serverSeq: 0,
        deletedAt: null,
      };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'schedule',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({ weekday, templateId, clientUpdatedAt: entry.clientUpdatedAt }),
    baseVersion: existing ? existing.version : null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
