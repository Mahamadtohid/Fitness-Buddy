import type { OutboxRow, WaterEntryRow } from '../db/schema';

/** Pure logic behind `logWater` (see waterEntryRepository.ts) — plain append, same shape as
 * `buildLogSetChange`. */
export function buildLogWaterChange(params: {
  localDate: string;
  ml: number;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: WaterEntryRow; outboxRow: OutboxRow } {
  const { localDate, ml, now, newId, newOpId } = params;

  const entry: WaterEntryRow = {
    id: newId,
    localDate,
    loggedAt: now,
    ml,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'water_entry',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({ localDate, loggedAt: now, ml, clientUpdatedAt: now }),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
