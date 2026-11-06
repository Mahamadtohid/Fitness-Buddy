import { eq } from 'drizzle-orm';

import { SYNC_STATE_SINGLETON_ID, getDb } from '../db/client';
import {
  exercise,
  outbox,
  scheduleEntry,
  setEntry,
  syncState,
  weightEntry,
  workoutSession,
  workoutTemplate,
  type ExerciseRow,
  type ScheduleEntryRow,
  type SetEntryRow,
  type WeightEntryRow,
  type WorkoutSessionRow,
  type WorkoutTemplateRow,
} from '../db/schema';
import { authorizedClient } from './authorizedClient';
import {
  decideCustomExercisePullApply,
  decidePullApply,
  decideScheduleEntryPullApply,
  decideSetEntryPullApply,
  decideWorkoutSessionPullApply,
  decideWorkoutTemplatePullApply,
  type PulledItem,
} from './pullApply';

/**
 * Applies one pulled item to the right local table. One branch per entity (PRD §7.5 step 5) —
 * same boring-dispatch philosophy as outboxProcessor.ts.
 */
function applyItem(db: ReturnType<typeof getDb>, item: PulledItem, now: string): void {
  const hasPendingOutbox = db.select().from(outbox).where(eq(outbox.recordId, item.recordId)).all().length > 0;

  switch (item.entity) {
    case 'weight_entry': {
      const existing = (db.select().from(weightEntry).where(eq(weightEntry.id, item.recordId)).all()[0] ??
        null) as WeightEntryRow | null;
      const decision = decidePullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(weightEntry).set(decision.entry).where(eq(weightEntry.id, item.recordId)).run();
      else db.insert(weightEntry).values(decision.entry).run();
      return;
    }
    case 'custom_exercise': {
      const existing = (db.select().from(exercise).where(eq(exercise.id, item.recordId)).all()[0] ??
        null) as ExerciseRow | null;
      const decision = decideCustomExercisePullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(exercise).set(decision.entry).where(eq(exercise.id, item.recordId)).run();
      else db.insert(exercise).values(decision.entry).run();
      return;
    }
    case 'workout_template': {
      const existing = (db.select().from(workoutTemplate).where(eq(workoutTemplate.id, item.recordId)).all()[0] ??
        null) as WorkoutTemplateRow | null;
      const decision = decideWorkoutTemplatePullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing)
        db.update(workoutTemplate).set(decision.entry).where(eq(workoutTemplate.id, item.recordId)).run();
      else db.insert(workoutTemplate).values(decision.entry).run();
      return;
    }
    case 'schedule': {
      const existing = (db.select().from(scheduleEntry).where(eq(scheduleEntry.id, item.recordId)).all()[0] ??
        null) as ScheduleEntryRow | null;
      const decision = decideScheduleEntryPullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(scheduleEntry).set(decision.entry).where(eq(scheduleEntry.id, item.recordId)).run();
      else db.insert(scheduleEntry).values(decision.entry).run();
      return;
    }
    case 'workout_session': {
      const existing = (db.select().from(workoutSession).where(eq(workoutSession.id, item.recordId)).all()[0] ??
        null) as WorkoutSessionRow | null;
      const decision = decideWorkoutSessionPullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(workoutSession).set(decision.entry).where(eq(workoutSession.id, item.recordId)).run();
      else db.insert(workoutSession).values(decision.entry).run();
      return;
    }
    case 'set_entry': {
      const existing = (db.select().from(setEntry).where(eq(setEntry.id, item.recordId)).all()[0] ??
        null) as SetEntryRow | null;
      const decision = decideSetEntryPullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(setEntry).set(decision.entry).where(eq(setEntry.id, item.recordId)).run();
      else db.insert(setEntry).values(decision.entry).run();
      return;
    }
    default:
      // Unknown entity (future phase) — nothing local to apply yet.
      return;
  }
}

/** Pages `/sync/pull` from the stored cursor, applying each item (PRD §7.5 step 5). */
export async function pullLatest(): Promise<void> {
  const db = getDb();
  let hasMore = true;

  while (hasMore) {
    const state = db.select().from(syncState).where(eq(syncState.id, SYNC_STATE_SINGLETON_ID)).all()[0] as
      | { lastCursor: number }
      | undefined;
    const cursor = state?.lastCursor ?? 0;

    const response = await authorizedClient.syncPull(cursor, 200);
    const now = new Date().toISOString();

    for (const raw of response.items) {
      applyItem(db, raw, now);
    }

    db.update(syncState)
      .set({ lastCursor: response.nextCursor, lastSyncedAt: now })
      .where(eq(syncState.id, SYNC_STATE_SINGLETON_ID))
      .run();

    hasMore = response.hasMore;
  }
}
