import { eq } from 'drizzle-orm';

import { SYNC_STATE_SINGLETON_ID, getDb } from '../db/client';
import {
  exercise,
  food,
  foodEntry,
  foodOverride,
  outbox,
  profile,
  savedMeal,
  scheduleEntry,
  setEntry,
  syncState,
  target,
  waterEntry,
  weightEntry,
  workoutSession,
  workoutTemplate,
  type ExerciseRow,
  type FoodEntryRow,
  type FoodOverrideRow,
  type FoodRow,
  type ProfileRow,
  type SavedMealRow,
  type ScheduleEntryRow,
  type SetEntryRow,
  type TargetRow,
  type WaterEntryRow,
  type WeightEntryRow,
  type WorkoutSessionRow,
  type WorkoutTemplateRow,
} from '../db/schema';
import { authorizedClient } from './authorizedClient';
import {
  decideCustomExercisePullApply,
  decideCustomFoodPullApply,
  decideFoodEntryPullApply,
  decideFoodOverridePullApply,
  decidePullApply,
  decideProfilePullApply,
  decideSavedMealPullApply,
  decideScheduleEntryPullApply,
  decideSetEntryPullApply,
  decideTargetsPullApply,
  decideWaterEntryPullApply,
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
    case 'profile': {
      const existing = (db.select().from(profile).where(eq(profile.id, item.recordId)).all()[0] ??
        null) as ProfileRow | null;
      const decision = decideProfilePullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(profile).set(decision.entry).where(eq(profile.id, item.recordId)).run();
      else db.insert(profile).values(decision.entry).run();
      return;
    }
    case 'targets': {
      const existing = (db.select().from(target).where(eq(target.id, item.recordId)).all()[0] ??
        null) as TargetRow | null;
      const decision = decideTargetsPullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(target).set(decision.entry).where(eq(target.id, item.recordId)).run();
      else db.insert(target).values(decision.entry).run();
      return;
    }
    case 'custom_food': {
      const existing = (db.select().from(food).where(eq(food.id, item.recordId)).all()[0] ?? null) as FoodRow | null;
      const decision = decideCustomFoodPullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(food).set(decision.entry).where(eq(food.id, item.recordId)).run();
      else db.insert(food).values(decision.entry).run();
      return;
    }
    case 'food_override': {
      const existing = (db.select().from(foodOverride).where(eq(foodOverride.id, item.recordId)).all()[0] ??
        null) as FoodOverrideRow | null;
      const decision = decideFoodOverridePullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(foodOverride).set(decision.entry).where(eq(foodOverride.id, item.recordId)).run();
      else db.insert(foodOverride).values(decision.entry).run();
      return;
    }
    case 'saved_meal': {
      const existing = (db.select().from(savedMeal).where(eq(savedMeal.id, item.recordId)).all()[0] ??
        null) as SavedMealRow | null;
      const decision = decideSavedMealPullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(savedMeal).set(decision.entry).where(eq(savedMeal.id, item.recordId)).run();
      else db.insert(savedMeal).values(decision.entry).run();
      return;
    }
    case 'food_entry': {
      const existing = (db.select().from(foodEntry).where(eq(foodEntry.id, item.recordId)).all()[0] ??
        null) as FoodEntryRow | null;
      const decision = decideFoodEntryPullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(foodEntry).set(decision.entry).where(eq(foodEntry.id, item.recordId)).run();
      else db.insert(foodEntry).values(decision.entry).run();
      return;
    }
    case 'water_entry': {
      const existing = (db.select().from(waterEntry).where(eq(waterEntry.id, item.recordId)).all()[0] ??
        null) as WaterEntryRow | null;
      const decision = decideWaterEntryPullApply({ item, existing, hasPendingOutbox, now });
      if (decision.action === 'noop') return;
      if (existing) db.update(waterEntry).set(decision.entry).where(eq(waterEntry.id, item.recordId)).run();
      else db.insert(waterEntry).values(decision.entry).run();
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
