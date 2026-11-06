import type { OutboxRow, WorkoutSessionRow } from '../db/schema';

export function buildStartSessionChange(params: {
  localDate: string;
  templateId: string | null;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: WorkoutSessionRow; outboxRow: OutboxRow } {
  const { localDate, templateId, now, newId, newOpId } = params;

  const entry: WorkoutSessionRow = {
    id: newId,
    localDate,
    templateId,
    startedAt: now,
    endedAt: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'workout_session',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({
      localDate,
      templateId,
      startedAt: now,
      endedAt: null,
      notes: null,
      clientUpdatedAt: now,
    }),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}

export function buildFinishSessionChange(params: {
  existing: WorkoutSessionRow;
  notes: string | null;
  now: string;
  newOpId: string;
}): { entry: WorkoutSessionRow; outboxRow: OutboxRow } {
  const { existing, notes, now, newOpId } = params;

  const entry: WorkoutSessionRow = { ...existing, endedAt: now, notes, updatedAt: now, clientUpdatedAt: now };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'workout_session',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({
      localDate: entry.localDate,
      templateId: entry.templateId,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      notes: entry.notes,
      clientUpdatedAt: entry.clientUpdatedAt,
    }),
    baseVersion: existing.version,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
