import type { MeasurementRow, OutboxRow } from '../db/schema';

export type MeasurementType = 'waist' | 'chest' | 'arm' | 'thigh';

/** Pure logic behind `logMeasurement` (see measurementRepository.ts) — always a brand-new insert,
 * same shape as `buildLogSetChange` (append-mostly, no secondary unique key). */
export function buildLogMeasurementChange(params: {
  localDate: string;
  type: MeasurementType;
  valueCm: number;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: MeasurementRow; outboxRow: OutboxRow } {
  const { localDate, type, valueCm, now, newId, newOpId } = params;

  const entry: MeasurementRow = {
    id: newId,
    localDate,
    type,
    valueCm,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'measurement',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({ localDate, type, valueCm, clientUpdatedAt: now }),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
