import type { OutboxRow, TargetRow } from '../db/schema';

export type TargetSource = 'auto' | 'manual' | 'check-in';

export type TargetValues = {
  effectiveFrom: string;
  kcalRest: number;
  kcalTraining: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  waterMl: number;
};

/** Pure logic behind `createTargets` (see targetsRepository.ts) — always a brand-new insert, same
 * shape as `buildStartSessionChange` (append-only history, never edited in place). */
export function buildCreateTargetsChange(params: {
  values: TargetValues;
  source: TargetSource;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: TargetRow; outboxRow: OutboxRow } {
  const { values, source, now, newId, newOpId } = params;

  const entry: TargetRow = {
    id: newId,
    ...values,
    source,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'targets',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({ ...values, source, clientUpdatedAt: now }),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
