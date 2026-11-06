import { eq } from 'drizzle-orm';

import type { SyncOpDto, SyncOpResultDto } from '../api/client';
import { getDb } from '../db/client';
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
  target,
  waterEntry,
  weightEntry,
  workoutSession,
  workoutTemplate,
  type OutboxRow,
} from '../db/schema';
import {
  decideCustomExercisePushResult,
  decideCustomFoodPushResult,
  decideFoodEntryPushResult,
  decideFoodOverridePushResult,
  decidePushResult,
  decideProfilePushResult,
  decideSavedMealPushResult,
  decideScheduleEntryPushResult,
  decideSetEntryPushResult,
  decideTargetsPushResult,
  decideWaterEntryPushResult,
  decideWorkoutSessionPushResult,
  decideWorkoutTemplatePushResult,
} from './pushApply';
import { useSyncStatusStore } from './syncStatusStore';
import { authorizedClient } from './authorizedClient';

/**
 * Applies one push ack to the right local table. One branch per entity (PRD §7.5 steps 2-4) —
 * kept as a plain switch rather than a generic registry, matching this project's preference for
 * boring, individually-readable dispatch over abstraction (see Phase 3 plan).
 */
function applyResult(db: ReturnType<typeof getDb>, entity: string, recordId: string, result: SyncOpResultDto): void {
  switch (entity) {
    case 'weight_entry': {
      const action = decidePushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(weightEntry).set(action.patch).where(eq(weightEntry.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'custom_exercise': {
      const action = decideCustomExercisePushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(exercise).set(action.patch).where(eq(exercise.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'workout_template': {
      const action = decideWorkoutTemplatePushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(workoutTemplate).set(action.patch).where(eq(workoutTemplate.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'schedule': {
      const action = decideScheduleEntryPushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(scheduleEntry).set(action.patch).where(eq(scheduleEntry.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'workout_session': {
      const action = decideWorkoutSessionPushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(workoutSession).set(action.patch).where(eq(workoutSession.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'set_entry': {
      const action = decideSetEntryPushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(setEntry).set(action.patch).where(eq(setEntry.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'profile': {
      const action = decideProfilePushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(profile).set(action.patch).where(eq(profile.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'targets': {
      const action = decideTargetsPushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(target).set(action.patch).where(eq(target.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'custom_food': {
      const action = decideCustomFoodPushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(food).set(action.patch).where(eq(food.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'food_override': {
      const action = decideFoodOverridePushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(foodOverride).set(action.patch).where(eq(foodOverride.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'saved_meal': {
      const action = decideSavedMealPushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(savedMeal).set(action.patch).where(eq(savedMeal.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'food_entry': {
      const action = decideFoodEntryPushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(foodEntry).set(action.patch).where(eq(foodEntry.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    case 'water_entry': {
      const action = decideWaterEntryPushResult(result);
      if (action.action === 'remove-outbox-and-update-entry') {
        db.update(waterEntry).set(action.patch).where(eq(waterEntry.id, recordId)).run();
      } else if (action.action === 'remove-outbox-and-record-error') {
        useSyncStatusStore.getState().setStatus('error', action.reason);
      }
      return;
    }
    default:
      // Unknown entity (future phase) — nothing local to patch; just drop the outbox row.
      return;
  }
}

/** Pushes up to 200 pending outbox rows and applies the server's ack (PRD §7.5 steps 2-4). */
export async function pushPending(): Promise<void> {
  const db = getDb();
  const pending = db.select().from(outbox).limit(200).all() as OutboxRow[];
  if (pending.length === 0) return;

  const ops: SyncOpDto[] = pending.map((row) => ({
    opId: row.opId,
    entity: row.entity,
    recordId: row.recordId,
    op: row.op as 'upsert' | 'delete',
    payload: JSON.parse(row.payload),
    baseVersion: row.baseVersion,
  }));

  const response = await authorizedClient.syncPush(ops);
  const byOpId = new Map(pending.map((row) => [row.opId, row]));

  for (const result of response.results) {
    const row = byOpId.get(result.opId);
    if (row) {
      applyResult(db, row.entity, row.recordId, result);
    }
    db.delete(outbox).where(eq(outbox.opId, result.opId)).run();
  }
}
