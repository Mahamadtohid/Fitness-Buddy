import { isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import { exercise, outbox, type ExerciseRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildCreateCustomExerciseChange, type CustomExerciseInput } from './exerciseLogic';

export function listExercisesByMuscleGroup(): Record<string, ExerciseRow[]> {
  const db = getDb();
  const rows = db
    .select()
    .from(exercise)
    .where(isNull(exercise.deletedAt))
    .orderBy(exercise.muscleGroup, exercise.name)
    .all() as ExerciseRow[];

  const grouped: Record<string, ExerciseRow[]> = {};
  for (const row of rows) {
    (grouped[row.muscleGroup] ??= []).push(row);
  }
  return grouped;
}

export function createCustomExercise(input: CustomExerciseInput): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildCreateCustomExerciseChange({
    input,
    now,
    newId: generateId(),
    newOpId: generateId(),
  });

  db.transaction((tx) => {
    tx.insert(exercise).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}
