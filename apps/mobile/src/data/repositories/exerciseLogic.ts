import type { ExerciseRow, OutboxRow } from '../db/schema';

export type CustomExerciseInput = {
  name: string;
  muscleGroup: string;
  equipment: string | null;
  isLowerBody: boolean;
  repMin: number;
  repMax: number;
  restSeconds: number;
};

/** Pure logic behind `createCustomExercise` (see exerciseRepository.ts) — custom exercises are
 * always brand-new inserts (no edit-in-place flow in this phase), unlike `weight_entry`'s
 * upsert-by-unique-key shape. */
export function buildCreateCustomExerciseChange(params: {
  input: CustomExerciseInput;
  now: string;
  newId: string;
  newOpId: string;
}): { entry: ExerciseRow; outboxRow: OutboxRow } {
  const { input, now, newId, newOpId } = params;

  const entry: ExerciseRow = {
    id: newId,
    name: input.name,
    muscleGroup: input.muscleGroup,
    equipment: input.equipment,
    isLowerBody: input.isLowerBody ? 1 : 0,
    repMin: input.repMin,
    repMax: input.repMax,
    restSeconds: input.restSeconds,
    isCustom: 1,
    createdAt: now,
    updatedAt: now,
    clientUpdatedAt: now,
    version: 0,
    serverSeq: 0,
    deletedAt: null,
  };

  const outboxRow: OutboxRow = {
    opId: newOpId,
    entity: 'custom_exercise',
    recordId: entry.id,
    op: 'upsert',
    payload: JSON.stringify({
      name: input.name,
      muscleGroup: input.muscleGroup,
      equipment: input.equipment,
      isLowerBody: input.isLowerBody,
      repMin: input.repMin,
      repMax: input.repMax,
      restSeconds: input.restSeconds,
      clientUpdatedAt: now,
    }),
    baseVersion: null,
    attempts: 0,
    lastError: null,
    createdAt: now,
  };

  return { entry, outboxRow };
}
