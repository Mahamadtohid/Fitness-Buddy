import type { WeightEntryPayload } from '../api/client';
import type { WeightEntryRow } from '../db/schema';

export type PulledItem = {
  entity: string;
  recordId: string;
  serverSeq: number;
  version: number;
  payload: WeightEntryPayload | null;
  deletedAt: string | null;
};

/**
 * Pure decision logic behind applying one pulled item (see pullProcessor.ts). A record with a
 * pending outbox row is never overwritten by a pull — it still has a local edit in flight that
 * hasn't reached the server yet (PRD §7.5).
 */
export type ApplyDecision =
  | { action: 'noop'; reason: 'pending-local-edit' | 'already-up-to-date' }
  | { action: 'upsert'; entry: WeightEntryRow }
  | { action: 'tombstone'; entry: WeightEntryRow };

export function decidePullApply(params: {
  item: PulledItem;
  existing: WeightEntryRow | null;
  hasPendingOutbox: boolean;
  now: string;
}): ApplyDecision {
  const { item, existing, hasPendingOutbox, now } = params;

  if (hasPendingOutbox) {
    return { action: 'noop', reason: 'pending-local-edit' };
  }

  if (existing && existing.version >= item.version && !item.deletedAt) {
    return { action: 'noop', reason: 'already-up-to-date' };
  }

  const payload = item.payload ?? {
    localDate: existing?.localDate ?? '',
    weightKg: existing?.weightKg ?? 0,
    clientUpdatedAt: existing?.clientUpdatedAt ?? now,
  };

  const entry: WeightEntryRow = {
    id: item.recordId,
    localDate: payload.localDate,
    weightKg: payload.weightKg,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    clientUpdatedAt: payload.clientUpdatedAt,
    version: item.version,
    serverSeq: item.serverSeq,
    deletedAt: item.deletedAt,
  };

  return item.deletedAt ? { action: 'tombstone', entry } : { action: 'upsert', entry };
}
