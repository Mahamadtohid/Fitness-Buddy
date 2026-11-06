import { isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, workoutTemplate, type WorkoutTemplateRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { SEED_EXERCISES } from '../db/seedExercises';
import { buildCreateTemplateChange, type TemplateItem } from './workoutTemplateLogic';

export function listTemplates(): WorkoutTemplateRow[] {
  const db = getDb();
  return db.select().from(workoutTemplate).where(isNull(workoutTemplate.deletedAt)).all() as WorkoutTemplateRow[];
}

export function createTemplate(name: string, items: TemplateItem[]): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildCreateTemplateChange({ name, items, now, newId: generateId(), newOpId: generateId() });

  db.transaction((tx) => {
    tx.insert(workoutTemplate).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

function byName(name: string): string {
  const found = SEED_EXERCISES.find((e) => e.name === name);
  if (!found) throw new Error(`Seed exercise not found: ${name}`);
  return found.id;
}

/**
 * Starter templates built from the seeded catalog — these go through the normal
 * create-locally-and-enqueue-outbox path, so this phase proves `workout_template` sync end to
 * end, not just `weight_entry`. Call once at app startup (idempotent — no-op once any template
 * exists). Deliberately NOT called from db/client.ts: doing so would make the low-level DB
 * connection module depend on the repository layer, a circular import (client.ts -> this file ->
 * client.ts via getDb). Call this from app startup instead (e.g. alongside auth bootstrap).
 */
export function seedStarterTemplatesIfEmpty(): void {
  if (listTemplates().length > 0) return;

  createTemplate('Push', [
    { exerciseId: byName('Barbell Bench Press'), setCount: 4, order: 0 },
    { exerciseId: byName('Overhead Press'), setCount: 3, order: 1 },
    { exerciseId: byName('Incline Dumbbell Press'), setCount: 3, order: 2 },
    { exerciseId: byName('Lateral Raise'), setCount: 3, order: 3 },
    { exerciseId: byName('Triceps Pushdown'), setCount: 3, order: 4 },
  ]);

  createTemplate('Pull', [
    { exerciseId: byName('Deadlift'), setCount: 3, order: 0 },
    { exerciseId: byName('Pull-Up'), setCount: 4, order: 1 },
    { exerciseId: byName('Barbell Row'), setCount: 3, order: 2 },
    { exerciseId: byName('Face Pull'), setCount: 3, order: 3 },
    { exerciseId: byName('Barbell Curl'), setCount: 3, order: 4 },
  ]);

  createTemplate('Legs', [
    { exerciseId: byName('Back Squat'), setCount: 4, order: 0 },
    { exerciseId: byName('Romanian Deadlift'), setCount: 3, order: 1 },
    { exerciseId: byName('Leg Press'), setCount: 3, order: 2 },
    { exerciseId: byName('Leg Extension'), setCount: 3, order: 3 },
    { exerciseId: byName('Standing Calf Raise'), setCount: 4, order: 4 },
  ]);
}
