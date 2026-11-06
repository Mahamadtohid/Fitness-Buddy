import type {
  ExerciseRow,
  ScheduleEntryRow,
  SetEntryRow,
  WeightEntryRow,
  WorkoutSessionRow,
  WorkoutTemplateRow,
} from '../db/schema';

export type PulledItem = {
  entity: string;
  recordId: string;
  serverSeq: number;
  version: number;
  payload?: unknown;
  deletedAt: string | null;
};

/**
 * Pure decision logic behind applying one pulled item (see pullProcessor.ts). A record with a
 * pending outbox row is never overwritten by a pull — it still has a local edit in flight that
 * hasn't reached the server yet (PRD §7.5). Shared across every entity; only the row-building
 * step (`buildRow`) differs per entity.
 */
export type ApplyDecision<TRow> =
  | { action: 'noop'; reason: 'pending-local-edit' | 'already-up-to-date' }
  | { action: 'upsert'; entry: TRow }
  | { action: 'tombstone'; entry: TRow };

function decideGenericPullApply<TRow extends { version: number; deletedAt: string | null }, TPayload>(params: {
  item: PulledItem;
  existing: TRow | null;
  hasPendingOutbox: boolean;
  now: string;
  buildRow: (payload: TPayload | null, existing: TRow | null, now: string) => TRow;
}): ApplyDecision<TRow> {
  const { item, existing, hasPendingOutbox, now, buildRow } = params;

  if (hasPendingOutbox) {
    return { action: 'noop', reason: 'pending-local-edit' };
  }

  if (existing && existing.version >= item.version && !item.deletedAt) {
    return { action: 'noop', reason: 'already-up-to-date' };
  }

  const entry = buildRow((item.payload as TPayload | undefined) ?? null, existing, now);
  return item.deletedAt ? { action: 'tombstone', entry } : { action: 'upsert', entry };
}

type WeightEntryPayload = { localDate: string; weightKg: number; clientUpdatedAt: string };

/** Unchanged signature/behavior from Phase 2 — existing tests cover this exactly as before. */
export function decidePullApply(params: {
  item: PulledItem;
  existing: WeightEntryRow | null;
  hasPendingOutbox: boolean;
  now: string;
}): ApplyDecision<WeightEntryRow> {
  return decideGenericPullApply<WeightEntryRow, WeightEntryPayload>({
    ...params,
    buildRow: (payload, existing, now) => {
      const p = payload ?? {
        localDate: existing?.localDate ?? '',
        weightKg: existing?.weightKg ?? 0,
        clientUpdatedAt: existing?.clientUpdatedAt ?? now,
      };
      return {
        id: params.item.recordId,
        localDate: p.localDate,
        weightKg: p.weightKg,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        clientUpdatedAt: p.clientUpdatedAt,
        version: params.item.version,
        serverSeq: params.item.serverSeq,
        deletedAt: params.item.deletedAt,
      };
    },
  });
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

export function decideCustomExercisePullApply(params: {
  item: PulledItem;
  existing: ExerciseRow | null;
  hasPendingOutbox: boolean;
  now: string;
}): ApplyDecision<ExerciseRow> {
  return decideGenericPullApply<ExerciseRow, CustomExercisePayload>({
    ...params,
    buildRow: (payload, existing, now) => {
      const p = payload ?? {
        name: existing?.name ?? '',
        muscleGroup: existing?.muscleGroup ?? '',
        equipment: existing?.equipment ?? null,
        isLowerBody: Boolean(existing?.isLowerBody),
        repMin: existing?.repMin ?? 0,
        repMax: existing?.repMax ?? 0,
        restSeconds: existing?.restSeconds ?? 90,
        clientUpdatedAt: existing?.clientUpdatedAt ?? now,
      };
      return {
        id: params.item.recordId,
        name: p.name,
        muscleGroup: p.muscleGroup,
        equipment: p.equipment,
        isLowerBody: p.isLowerBody ? 1 : 0,
        repMin: p.repMin,
        repMax: p.repMax,
        restSeconds: p.restSeconds,
        isCustom: 1,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        clientUpdatedAt: p.clientUpdatedAt,
        version: params.item.version,
        serverSeq: params.item.serverSeq,
        deletedAt: params.item.deletedAt,
      };
    },
  });
}

type WorkoutTemplatePayload = { name: string; itemsJson: string; clientUpdatedAt: string };

export function decideWorkoutTemplatePullApply(params: {
  item: PulledItem;
  existing: WorkoutTemplateRow | null;
  hasPendingOutbox: boolean;
  now: string;
}): ApplyDecision<WorkoutTemplateRow> {
  return decideGenericPullApply<WorkoutTemplateRow, WorkoutTemplatePayload>({
    ...params,
    buildRow: (payload, existing, now) => {
      const p = payload ?? {
        name: existing?.name ?? '',
        itemsJson: existing?.itemsJson ?? '[]',
        clientUpdatedAt: existing?.clientUpdatedAt ?? now,
      };
      return {
        id: params.item.recordId,
        name: p.name,
        itemsJson: p.itemsJson,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        clientUpdatedAt: p.clientUpdatedAt,
        version: params.item.version,
        serverSeq: params.item.serverSeq,
        deletedAt: params.item.deletedAt,
      };
    },
  });
}

type ScheduleEntryPayload = { weekday: number; templateId: string | null; clientUpdatedAt: string };

export function decideScheduleEntryPullApply(params: {
  item: PulledItem;
  existing: ScheduleEntryRow | null;
  hasPendingOutbox: boolean;
  now: string;
}): ApplyDecision<ScheduleEntryRow> {
  return decideGenericPullApply<ScheduleEntryRow, ScheduleEntryPayload>({
    ...params,
    buildRow: (payload, existing, now) => {
      const p = payload ?? {
        weekday: existing?.weekday ?? 0,
        templateId: existing?.templateId ?? null,
        clientUpdatedAt: existing?.clientUpdatedAt ?? now,
      };
      return {
        id: params.item.recordId,
        weekday: p.weekday,
        templateId: p.templateId,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        clientUpdatedAt: p.clientUpdatedAt,
        version: params.item.version,
        serverSeq: params.item.serverSeq,
        deletedAt: params.item.deletedAt,
      };
    },
  });
}

type WorkoutSessionPayload = {
  localDate: string;
  templateId: string | null;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  clientUpdatedAt: string;
};

export function decideWorkoutSessionPullApply(params: {
  item: PulledItem;
  existing: WorkoutSessionRow | null;
  hasPendingOutbox: boolean;
  now: string;
}): ApplyDecision<WorkoutSessionRow> {
  return decideGenericPullApply<WorkoutSessionRow, WorkoutSessionPayload>({
    ...params,
    buildRow: (payload, existing, now) => {
      const p = payload ?? {
        localDate: existing?.localDate ?? '',
        templateId: existing?.templateId ?? null,
        startedAt: existing?.startedAt ?? now,
        endedAt: existing?.endedAt ?? null,
        notes: existing?.notes ?? null,
        clientUpdatedAt: existing?.clientUpdatedAt ?? now,
      };
      return {
        id: params.item.recordId,
        localDate: p.localDate,
        templateId: p.templateId,
        startedAt: p.startedAt,
        endedAt: p.endedAt,
        notes: p.notes,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        clientUpdatedAt: p.clientUpdatedAt,
        version: params.item.version,
        serverSeq: params.item.serverSeq,
        deletedAt: params.item.deletedAt,
      };
    },
  });
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

export function decideSetEntryPullApply(params: {
  item: PulledItem;
  existing: SetEntryRow | null;
  hasPendingOutbox: boolean;
  now: string;
}): ApplyDecision<SetEntryRow> {
  return decideGenericPullApply<SetEntryRow, SetEntryPayload>({
    ...params,
    buildRow: (payload, existing, now) => {
      const p = payload ?? {
        sessionId: existing?.sessionId ?? '',
        exerciseId: existing?.exerciseId ?? '',
        setNo: existing?.setNo ?? 0,
        weightKg: existing?.weightKg ?? 0,
        reps: existing?.reps ?? 0,
        rpe: existing?.rpe ?? null,
        isWarmup: Boolean(existing?.isWarmup),
        completed: existing ? Boolean(existing.completed) : true,
        clientUpdatedAt: existing?.clientUpdatedAt ?? now,
      };
      return {
        id: params.item.recordId,
        sessionId: p.sessionId,
        exerciseId: p.exerciseId,
        setNo: p.setNo,
        weightKg: p.weightKg,
        reps: p.reps,
        rpe: p.rpe,
        isWarmup: p.isWarmup ? 1 : 0,
        completed: p.completed ? 1 : 0,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        clientUpdatedAt: p.clientUpdatedAt,
        version: params.item.version,
        serverSeq: params.item.serverSeq,
        deletedAt: params.item.deletedAt,
      };
    },
  });
}
