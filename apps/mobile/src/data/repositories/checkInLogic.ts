import type { CheckInRow, OutboxRow } from '../db/schema';

export type CheckInDecision = 'pending' | 'accepted' | 'edited' | 'skipped';

/** Pure logic behind `generateCheckIn` (see checkInRepository.ts) — a brand-new row with
 * `decision:'pending'`. Deliberately does NOT build an outbox row: a generated-but-undecided
 * check-in is a local draft, not yet pushed (see checkInRepository.ts's module doc for why). */
export function buildGenerateCheckInChange(params: {
  weekStart: string;
  trendChange: number;
  suggestedKcal: number;
  now: string;
  newId: string;
}): CheckInRow {
  const { weekStart, trendChange, suggestedKcal, now, newId } = params;
  return {
    id: newId,
    weekStart,
    trendChange,
    suggestedKcal,
    decision: 'pending',
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };
}

/** Pure logic behind `recordDecision` — updates the row's decision (and `suggestedKcal` if the
 * user edited it) and, unlike `generateCheckIn`, DOES build an outbox row: this is the first time
 * the record is ever pushed, so `baseVersion` is `null` (the server has never seen this id). */
export function buildRecordDecisionChange(params: {
  existing: CheckInRow;
  decision: 'accepted' | 'edited' | 'skipped';
  editedKcalChange?: number;
  now: string;
  newOpId: string;
}): { entry: CheckInRow; outboxRow: OutboxRow } {
  const { existing, decision, editedKcalChange, now, newOpId } = params;

  const suggestedKcal =
    decision === 'edited' && editedKcalChange !== undefined ? editedKcalChange : existing.suggestedKcal;

  const entry: CheckInRow = {
    ...existing,
    decision,
    suggestedKcal,
    updatedAt: now,
    clientUpdatedAt: now,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'check_in',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({
      weekStart: entry.weekStart,
      trendChange: entry.trendChange,
      suggestedKcal: entry.suggestedKcal,
      decision,
      clientUpdatedAt: now,
    }),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
