import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, setEntry, workoutSession, type SetEntryRow, type WorkoutSessionRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildFinishSessionChange, buildStartSessionChange } from './workoutSessionLogic';
import { calculateWorkoutStreak } from '../../domain/streak';
import { getLocalDateString } from '../../platform/localDate';

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

/** Whether a (non-deleted) session already exists for this local date — used by the water
 * target's training-day bump (PRD §3.6) and the Today summary's calorie target. */
export function hasSessionForDate(localDate: string): boolean {
  return sessionCountForDate(localDate) > 0;
}

/** Number of (non-deleted) sessions logged on this local date — PRD allows more than one session
 * per day, so this is the real count, not just a trained/not-trained flag (used by Progress's
 * "Workouts" weekly stat). */
export function sessionCountForDate(localDate: string): number {
  const db = getDb();
  return db
    .select({ id: workoutSession.id })
    .from(workoutSession)
    .where(and(eq(workoutSession.localDate, localDate), isNull(workoutSession.deletedAt)))
    .all().length;
}

/** Completed workout sessions only — an abandoned active session must not award streak credit. */
export function listCompletedWorkoutDates(): string[] {
  const db = getDb();
  return (
    db
      .select({ localDate: workoutSession.localDate })
      .from(workoutSession)
      .where(and(isNull(workoutSession.deletedAt), isNotNull(workoutSession.endedAt)))
      .all() as { localDate: string }[]
  ).map((row) => row.localDate);
}

/** Current/longest streak and the last-week strip, with Sunday treated as a recovery day. */
export function getWorkoutStreak() {
  return calculateWorkoutStreak(listCompletedWorkoutDates(), getLocalDateString());
}
