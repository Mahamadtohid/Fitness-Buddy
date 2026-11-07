import type { SyncOpResultDto } from '../api/client';
import type {
  CheckInRow,
  ExerciseRow,
  FoodEntryRow,
  FoodOverrideRow,
  FoodRow,
  MeasurementRow,
  ProfileRow,
  SavedMealRow,
  ScheduleEntryRow,
  SetEntryRow,
  TargetRow,
  WaterEntryRow,
  WeightEntryRow,
  WorkoutSessionRow,
  WorkoutTemplateRow,
} from '../db/schema';

/**
 * Pure decision logic behind applying a push ack (see outboxProcessor.ts). `applied` and
 * `conflict` both resolve the same way for every entity here: the server has already decided the
 * winning copy (last-write-wins), so the client just accepts it — there's no local merge step.
 * `rejected` is a permanent failure: stop retrying and surface the reason.
 */
export type PushResultAction<TRow> =
  | { action: 'remove-outbox' }
  | { action: 'remove-outbox-and-update-entry'; patch: Partial<TRow> }
  | { action: 'remove-outbox-and-record-error'; reason: string };

function decideGenericPushResult<TRow extends { version: number; serverSeq: number }, TPayload>(
  result: SyncOpResultDto,
  payloadToPatch: (payload: TPayload) => Partial<TRow>,
): PushResultAction<TRow> {
  if (result.status === 'rejected') {
    return { action: 'remove-outbox-and-record-error', reason: result.reason ?? 'Rejected by server' };
  }

  if (result.serverCopy) {
    const patch = {
      version: result.serverCopy.version,
      serverSeq: result.serverCopy.serverSeq,
    } as Partial<TRow>;
    if (result.serverCopy.payload) {
      Object.assign(patch, payloadToPatch(result.serverCopy.payload as TPayload));
    }
    return { action: 'remove-outbox-and-update-entry', patch };
  }

  return { action: 'remove-outbox' };
}

type WeightEntryPayload = { localDate: string; weightKg: number; clientUpdatedAt: string };

/** Unchanged signature/behavior from Phase 2 — existing tests cover this exactly as before. */
export function decidePushResult(result: SyncOpResultDto): PushResultAction<WeightEntryRow> {
  return decideGenericPushResult<WeightEntryRow, WeightEntryPayload>(result, (payload) => ({
    localDate: payload.localDate,
    weightKg: payload.weightKg,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type CustomExercisePayload = {
  name: string;
  muscleGroup: string;
  equipment: string | null;
  isLowerBody: boolean;
  repMin: number;
  repMax: number;
  restSeconds: number;
  clientUpdatedAt: string;
};

export function decideCustomExercisePushResult(result: SyncOpResultDto): PushResultAction<ExerciseRow> {
  return decideGenericPushResult<ExerciseRow, CustomExercisePayload>(result, (payload) => ({
    name: payload.name,
    muscleGroup: payload.muscleGroup,
    equipment: payload.equipment,
    isLowerBody: payload.isLowerBody ? 1 : 0,
    repMin: payload.repMin,
    repMax: payload.repMax,
    restSeconds: payload.restSeconds,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type WorkoutTemplatePayload = { name: string; itemsJson: string; clientUpdatedAt: string };

export function decideWorkoutTemplatePushResult(result: SyncOpResultDto): PushResultAction<WorkoutTemplateRow> {
  return decideGenericPushResult<WorkoutTemplateRow, WorkoutTemplatePayload>(result, (payload) => ({
    name: payload.name,
    itemsJson: payload.itemsJson,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type ScheduleEntryPayload = { weekday: number; templateId: string | null; clientUpdatedAt: string };

export function decideScheduleEntryPushResult(result: SyncOpResultDto): PushResultAction<ScheduleEntryRow> {
  return decideGenericPushResult<ScheduleEntryRow, ScheduleEntryPayload>(result, (payload) => ({
    weekday: payload.weekday,
    templateId: payload.templateId,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type WorkoutSessionPayload = {
  localDate: string;
  templateId: string | null;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  clientUpdatedAt: string;
};

export function decideWorkoutSessionPushResult(result: SyncOpResultDto): PushResultAction<WorkoutSessionRow> {
  return decideGenericPushResult<WorkoutSessionRow, WorkoutSessionPayload>(result, (payload) => ({
    localDate: payload.localDate,
    templateId: payload.templateId,
    startedAt: payload.startedAt,
    endedAt: payload.endedAt,
    notes: payload.notes,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type SetEntryPayload = {
  sessionId: string;
  exerciseId: string;
  setNo: number;
  weightKg: number;
  reps: number;
  rpe: number | null;
  isWarmup: boolean;
  completed: boolean;
  clientUpdatedAt: string;
};

export function decideSetEntryPushResult(result: SyncOpResultDto): PushResultAction<SetEntryRow> {
  return decideGenericPushResult<SetEntryRow, SetEntryPayload>(result, (payload) => ({
    sessionId: payload.sessionId,
    exerciseId: payload.exerciseId,
    setNo: payload.setNo,
    weightKg: payload.weightKg,
    reps: payload.reps,
    rpe: payload.rpe,
    isWarmup: payload.isWarmup ? 1 : 0,
    completed: payload.completed ? 1 : 0,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type ProfilePayload = {
  sex: string;
  birthDate: string;
  heightCm: number;
  lifestyleFactor: number;
  goal: string;
  rateKgPerWeek: number;
  units: string;
  timeZone: string;
  clientUpdatedAt: string;
};

export function decideProfilePushResult(result: SyncOpResultDto): PushResultAction<ProfileRow> {
  return decideGenericPushResult<ProfileRow, ProfilePayload>(result, (payload) => ({
    sex: payload.sex,
    birthDate: payload.birthDate,
    heightCm: payload.heightCm,
    lifestyleFactor: payload.lifestyleFactor,
    goal: payload.goal,
    rateKgPerWeek: payload.rateKgPerWeek,
    units: payload.units,
    timeZone: payload.timeZone,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type TargetPayload = {
  effectiveFrom: string;
  kcalRest: number;
  kcalTraining: number;
  proteinG: number;
  fatG: number;
  carbG: number;
  waterMl: number;
  source: string;
  clientUpdatedAt: string;
};

export function decideTargetsPushResult(result: SyncOpResultDto): PushResultAction<TargetRow> {
  return decideGenericPushResult<TargetRow, TargetPayload>(result, (payload) => ({
    effectiveFrom: payload.effectiveFrom,
    kcalRest: payload.kcalRest,
    kcalTraining: payload.kcalTraining,
    proteinG: payload.proteinG,
    fatG: payload.fatG,
    carbG: payload.carbG,
    waterMl: payload.waterMl,
    source: payload.source,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type CustomFoodPayload = {
  name: string;
  servingUnit: string;
  servingG: number;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  clientUpdatedAt: string;
};

export function decideCustomFoodPushResult(result: SyncOpResultDto): PushResultAction<FoodRow> {
  return decideGenericPushResult<FoodRow, CustomFoodPayload>(result, (payload) => ({
    name: payload.name,
    servingUnit: payload.servingUnit,
    servingG: payload.servingG,
    kcal: payload.kcal,
    proteinG: payload.proteinG,
    carbG: payload.carbG,
    fatG: payload.fatG,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type FoodOverridePayload = {
  foodId: string;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  clientUpdatedAt: string;
};

export function decideFoodOverridePushResult(result: SyncOpResultDto): PushResultAction<FoodOverrideRow> {
  return decideGenericPushResult<FoodOverrideRow, FoodOverridePayload>(result, (payload) => ({
    foodId: payload.foodId,
    kcal: payload.kcal,
    proteinG: payload.proteinG,
    carbG: payload.carbG,
    fatG: payload.fatG,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type SavedMealPayload = { name: string; itemsJson: string; clientUpdatedAt: string };

export function decideSavedMealPushResult(result: SyncOpResultDto): PushResultAction<SavedMealRow> {
  return decideGenericPushResult<SavedMealRow, SavedMealPayload>(result, (payload) => ({
    name: payload.name,
    itemsJson: payload.itemsJson,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type FoodEntryPayload = {
  localDate: string;
  mealSlot: string;
  foodId: string | null;
  quickAddName: string | null;
  quickAddKcal: number | null;
  quickAddProteinG: number | null;
  servings: number;
  clientUpdatedAt: string;
};

export function decideFoodEntryPushResult(result: SyncOpResultDto): PushResultAction<FoodEntryRow> {
  return decideGenericPushResult<FoodEntryRow, FoodEntryPayload>(result, (payload) => ({
    localDate: payload.localDate,
    mealSlot: payload.mealSlot,
    foodId: payload.foodId,
    quickAddName: payload.quickAddName,
    quickAddKcal: payload.quickAddKcal,
    quickAddProteinG: payload.quickAddProteinG,
    servings: payload.servings,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type WaterEntryPayload = { localDate: string; loggedAt: string; ml: number; clientUpdatedAt: string };

export function decideWaterEntryPushResult(result: SyncOpResultDto): PushResultAction<WaterEntryRow> {
  return decideGenericPushResult<WaterEntryRow, WaterEntryPayload>(result, (payload) => ({
    localDate: payload.localDate,
    loggedAt: payload.loggedAt,
    ml: payload.ml,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type MeasurementPayload = { localDate: string; type: string; valueCm: number; clientUpdatedAt: string };

export function decideMeasurementPushResult(result: SyncOpResultDto): PushResultAction<MeasurementRow> {
  return decideGenericPushResult<MeasurementRow, MeasurementPayload>(result, (payload) => ({
    localDate: payload.localDate,
    type: payload.type,
    valueCm: payload.valueCm,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}

type CheckInPayload = {
  weekStart: string;
  trendChange: number;
  suggestedKcal: number;
  decision: string;
  clientUpdatedAt: string;
};

export function decideCheckInPushResult(result: SyncOpResultDto): PushResultAction<CheckInRow> {
  return decideGenericPushResult<CheckInRow, CheckInPayload>(result, (payload) => ({
    weekStart: payload.weekStart,
    trendChange: payload.trendChange,
    suggestedKcal: payload.suggestedKcal,
    decision: payload.decision,
    clientUpdatedAt: payload.clientUpdatedAt,
  }));
}
