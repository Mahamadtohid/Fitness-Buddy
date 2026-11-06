import { desc, eq, isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, setEntry, workoutSession, type SetEntryRow, type WorkoutSessionRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildFinishSessionChange, buildStartSessionChange } from './workoutSessionLogic';

export function startSession(localDate: string, templateId: string | null): string {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildStartSessionChange({
    localDate,
    templateId,
    now,
    newId: generateId(),
    newOpId: generateId(),
  });

  db.transaction((tx) => {
    tx.insert(workoutSession).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
  return entry.id;
}

export function finishSession(sessionId: string, notes: string | null = null): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.transaction((tx) => {
    const existing = (tx.select().from(workoutSession).where(eq(workoutSession.id, sessionId)).all()[0] ??
      null) as WorkoutSessionRow | null;
    if (!existing) return;

    const { entry, outboxRow } = buildFinishSessionChange({
      existing,
      notes: notes ?? existing.notes,
      now,
      newOpId: generateId(),
    });

    tx.update(workoutSession).set(entry).where(eq(workoutSession.id, sessionId)).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

function recentSessionIds(): string[] {
  const db = getDb();
  return (
    db
      .select({ id: workoutSession.id })
      .from(workoutSession)
      .where(isNull(workoutSession.deletedAt))
      .orderBy(desc(workoutSession.startedAt))
      .all() as { id: string }[]
  ).map((row) => row.id);
}

function completedWorkingSetsFor(sessionId: string, exerciseId: string): SetEntryRow[] {
  const db = getDb();
  return db
    .select()
    .from(setEntry)
    .where(eq(setEntry.sessionId, sessionId))
    .orderBy(setEntry.setNo)
    .all()
    .filter(
      (row) => row.exerciseId === exerciseId && row.completed === 1 && row.isWarmup === 0 && row.deletedAt === null,
    ) as SetEntryRow[];
}

/** Most recent prior session's completed working sets for this exercise — used to pre-fill the
 * active workout screen's weight/reps inputs. */
export function lastSessionSetsFor(exerciseId: string): SetEntryRow[] {
  for (const sessionId of recentSessionIds()) {
    const sets = completedWorkingSetsFor(sessionId, exerciseId);
    if (sets.length > 0) return sets;
  }
  return [];
}

/** Up to the last two sessions' completed working-set rep counts for this exercise, most recent
 * first — the exact shape `src/domain/overload.ts#suggestOverload` expects. */
export function lastTwoSessionsRepsFor(exerciseId: string): number[][] {
  const result: number[][] = [];
  for (const sessionId of recentSessionIds()) {
    const sets = completedWorkingSetsFor(sessionId, exerciseId);
    if (sets.length > 0) {
      result.push(sets.map((s) => s.reps));
      if (result.length === 2) break;
    }
  }
  return result;
}
