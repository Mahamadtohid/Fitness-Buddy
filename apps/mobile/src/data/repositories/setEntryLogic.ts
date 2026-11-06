import type { OutboxRow, SetEntryRow } from '../db/schema';

export function buildLogSetChange(params: {
  sessionId: string;
  exerciseId: string;
  setNo: number;
  weightKg: number;
  reps: number;
  rpe?: number | null;
  isWarmup?: boolean;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: SetEntryRow; outboxRow: OutboxRow } {
  const { sessionId, exerciseId, setNo, weightKg, reps, rpe = null, isWarmup = false, now, newId, newOpId } = params;

  const entry: SetEntryRow = {
    id: newId,
    sessionId,
    exerciseId,
    setNo,
    weightKg,
    reps,
    rpe,
    isWarmup: isWarmup ? 1 : 0,
    completed: 1,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'set_entry',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({
      sessionId,
      exerciseId,
      setNo,
      weightKg,
      reps,
      rpe,
      isWarmup,
      completed: true,
      clientUpdatedAt: now,
    }),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
