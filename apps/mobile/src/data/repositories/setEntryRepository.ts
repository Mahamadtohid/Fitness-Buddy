import { eq, inArray } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, setEntry, workoutSession, type SetEntryRow, type WorkoutSessionRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildLogSetChange } from './setEntryLogic';

export function logSet(
  sessionId: string,
  exerciseId: string,
  setNo: number,
  weightKg: number,
  reps: number,
  opts: { rpe?: number | null; isWarmup?: boolean } = {},
): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildLogSetChange({
    sessionId,
    exerciseId,
    setNo,
    weightKg,
    reps,
    rpe: opts.rpe,
    isWarmup: opts.isWarmup,
    now,
    newId: generateId(),
    newOpId: generateId(),
  });

  db.transaction((tx) => {
    tx.insert(setEntry).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

/** Full chronological (oldest first) history of completed, non-warmup, non-deleted sets for this
 * exercise across all sessions — the per-exercise history/1RM-chart/PR-badge screen's data source.
 * No `relations()` are declared on these tables anywhere in this app, so the join to
 * `workoutSession` (for each set's session date) is done manually here, matching this repository
 * file's existing style. */
export function historyForExercise(
  exerciseId: string,
): { localDate: string; weightKg: number; reps: number; rpe: number | null }[] {
  const db = getDb();

  const sets = db.select().from(setEntry).where(eq(setEntry.exerciseId, exerciseId)).all().filter(
    (row) => row.completed === 1 && row.isWarmup === 0 && row.deletedAt === null,
  ) as SetEntryRow[];

  const sessionIds = [...new Set(sets.map((set) => set.sessionId))];
  const sessions = sessionIds.length
    ? (db
        .select()
        .from(workoutSession)
        .where(inArray(workoutSession.id, sessionIds))
        .all()
        .filter((session) => session.deletedAt === null) as WorkoutSessionRow[])
    : [];
  const sessionById = new Map(sessions.map((session) => [session.id, session]));

  return sets
    .map((set) => {
      const session = sessionById.get(set.sessionId);
      return session ? { set, session } : null;
    })
    .filter((row): row is { set: SetEntryRow; session: WorkoutSessionRow } => row !== null)
    .sort((a, b) => {
      const byStartedAt = a.session.startedAt.localeCompare(b.session.startedAt);
      return byStartedAt !== 0 ? byStartedAt : a.set.setNo - b.set.setNo;
    })
    .map(({ set, session }) => ({
      localDate: session.localDate,
      weightKg: set.weightKg,
      reps: set.reps,
      rpe: set.rpe,
    }));
}
