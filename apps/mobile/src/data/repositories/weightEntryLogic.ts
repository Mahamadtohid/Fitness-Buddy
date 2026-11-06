import type { WeightEntryRow, OutboxRow } from '../db/schema';

/**
 * Pure decision logic behind `logWeight` (see weightEntryRepository.ts), extracted so it can be
 * unit-tested without a real SQLite connection — expo-sqlite is a native module and doesn't run
 * under Jest, so the repository itself stays a thin, untested wrapper around this function.
 */
export function buildLogWeightChange(params: {
  existing: WeightEntryRow | null;
  localDate: string;
  weightKg: number;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: WeightEntryRow; outboxRow: OutboxRow } {
  const { existing, localDate, weightKg, now, newId, newOpId } = params;

  const entry: WeightEntryRow = existing
    ? { ...existing, weightKg, updatedAt: now, clientUpdatedAt: now }
    : {
        id: newId,
        localDate,
        weightKg,
        createdAt: now,
        updatedAt: now,
        clientUpdatedAt: now,
        version: 0,
        serverSeq: 0,
        deletedAt: null,
      };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'weight_entry',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({ localDate, weightKg, clientUpdatedAt: entry.clientUpdatedAt }),
    baseVersion: existing ? existing.version : null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
