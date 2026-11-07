import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, radius, spacing, TextField, Typography, useTheme } from '../src/design';
import { listExercisesByMuscleGroup } from '../src/data/repositories/exerciseRepository';
import { listTemplates } from '../src/data/repositories/workoutTemplateRepository';
import type { TemplateItem } from '../src/data/repositories/workoutTemplateLogic';
import {
  lastSessionSetsFor,
  lastTwoSessionsRepsFor,
  startSession,
  finishSession,
} from '../src/data/repositories/workoutSessionRepository';
import { logSet } from '../src/data/repositories/setEntryRepository';
import { suggestOverload } from '../src/domain/overload';
import { activateKeepAwake, deactivateKeepAwake } from '../src/platform/keepAwake';
import { triggerHaptic } from '../src/platform/haptics';
import { cancelNotification, scheduleRestTimerNotification } from '../src/platform/notifications';
import type { ExerciseRow } from '../src/data/db/schema';
import { getLocalDateString } from '../src/platform/localDate';

type SetRow = { weightKg: string; reps: string; rpe: string; confirmed: boolean };

function overloadMessage(suggestion: ReturnType<typeof suggestOverload>): string | null {
  if (suggestion === 'increase-weight') return 'Last 2 sessions at the top of your rep range — try adding weight.';
  if (suggestion === 'reduce-weight') return 'Reps dropped below range for 2 sessions — hold or reduce weight 10%.';
  return null;
}

export default function ActiveWorkoutScreen() {
  const { colors } = useTheme();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const [sessionId] = useState(() => startSession(getLocalDateString(), templateId ?? null));

  const template = useMemo(() => listTemplates().find((t) => t.id === templateId), [templateId]);
  const allExercises = useMemo(() => Object.values(listExercisesByMuscleGroup()).flat(), []);
  const items = useMemo<TemplateItem[]>(() => {
    if (!template) return [];
    return (JSON.parse(template.itemsJson) as TemplateItem[]).slice().sort((a, b) => a.order - b.order);
  }, [template]);

  const exerciseFor = (exerciseId: string): ExerciseRow | undefined =>
    allExercises.find((e) => e.id === exerciseId);

  const [setsByExercise, setSetsByExercise] = useState<Record<string, SetRow[]>>(() => {
    const initial: Record<string, SetRow[]> = {};
    for (const item of items) {
      const previous = lastSessionSetsFor(item.exerciseId);
      initial[item.exerciseId] = Array.from({ length: item.setCount }, (_, i) => ({
        weightKg: previous[i] ? String(previous[i].weightKg) : '',
        reps: previous[i] ? String(previous[i].reps) : '',
        rpe: previous[i]?.rpe != null ? String(previous[i].rpe) : '',
        confirmed: false,
      }));
    }
    return initial;
  });

  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [finishNotes, setFinishNotes] = useState('');

  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [restExerciseName, setRestExerciseName] = useState('');
  const restInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingNotificationId = useRef<string | null>(null);

  useEffect(() => {
    activateKeepAwake();
    return () => {
      deactivateKeepAwake();
      if (restInterval.current) clearInterval(restInterval.current);
      if (pendingNotificationId.current) void cancelNotification(pendingNotificationId.current);
    };
  }, []);

  async function startRestTimer(exerciseName: string, seconds: number) {
    if (restInterval.current) clearInterval(restInterval.current);
    if (pendingNotificationId.current) {
      await cancelNotification(pendingNotificationId.current);
      pendingNotificationId.current = null;
    }

    setRestExerciseName(exerciseName);
    setRestRemaining(seconds);
    void triggerHaptic('success');
    pendingNotificationId.current = await scheduleRestTimerNotification({ secondsRemaining: seconds, exerciseName });

    restInterval.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (restInterval.current) clearInterval(restInterval.current);
          restInterval.current = null;
          void triggerHaptic('medium');
          if (pendingNotificationId.current) {
            void cancelNotification(pendingNotificationId.current);
            pendingNotificationId.current = null;
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function updateSet(exerciseId: string, index: number, patch: Partial<SetRow>) {
    setSetsByExercise((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function confirmSet(exerciseId: string, index: number) {
    const row = setsByExercise[exerciseId][index];
    const weightKg = Number(row.weightKg);
    const reps = Number(row.reps);
    if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(reps) || reps <= 0) return;

    logSet(sessionId, exerciseId, index + 1, weightKg, reps, { isWarmup: false, rpe: Number(row.rpe) || null });
    updateSet(exerciseId, index, { confirmed: true });

    const exercise = exerciseFor(exerciseId);
    void startRestTimer(exercise?.name ?? 'next exercise', exercise?.restSeconds ?? 90);
  }

  function onFinish() {
    setFinishNotes('');
    setFinishModalOpen(true);
  }

  function finishAndClose(notes: string | null) {
    finishSession(sessionId, notes);
    setFinishModalOpen(false);
    deactivateKeepAwake();
    router.back();
  }

  if (!template) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Typography variant="body">This template is no longer available.</Typography>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="headline">{template.name}</Typography>

      {restRemaining !== null ? (
        <Card style={styles.restCard}>
          <Typography variant="bodyStrong">Resting — {restRemaining}s</Typography>
          <Typography variant="caption" color="secondary">
            Next: {restExerciseName}
          </Typography>
        </Card>
      ) : null}

      {items.map((item) => {
        const exercise = exerciseFor(item.exerciseId);
        const sets = setsByExercise[item.exerciseId] ?? [];
        const suggestion = exercise
          ? suggestOverload({ repMin: exercise.repMin, repMax: exercise.repMax }, lastTwoSessionsRepsFor(item.exerciseId))
          : 'none';
        const hint = overloadMessage(suggestion);

        return (
          <Pressable
            key={item.exerciseId}
            onPress={() =>
              router.push({ pathname: '/exercise/[exerciseId]', params: { exerciseId: item.exerciseId } })
            }
          >
            <Card style={styles.exerciseCard}>
              <Typography variant="title">{exercise?.name ?? 'Unknown exercise'}</Typography>
              {exercise ? (
                <Typography variant="caption" color="secondary">
                  {exercise.repMin}-{exercise.repMax} reps · rest {exercise.restSeconds}s
                </Typography>
              ) : null}
              {hint ? (
                <Typography variant="caption" color="accent">
                  {hint}
                </Typography>
              ) : null}

              {sets.map((set, index) => (
                <View key={index} style={styles.setRow}>
                  <Typography variant="body" style={styles.setLabel}>
                    Set {index + 1}
                  </Typography>
                  <View style={styles.setInput}>
                    <TextField
                      label="kg"
                      value={set.weightKg}
                      onChangeText={(v) => updateSet(item.exerciseId, index, { weightKg: v })}
                      keyboardType="decimal-pad"
                      editable={!set.confirmed}
                    />
                  </View>
                  <View style={styles.setInput}>
                    <TextField
                      label="reps"
                      value={set.reps}
                      onChangeText={(v) => updateSet(item.exerciseId, index, { reps: v })}
                      keyboardType="number-pad"
                      editable={!set.confirmed}
                    />
                  </View>
                  <View style={styles.setInput}>
                    <TextField
                      label="RPE"
                      value={set.rpe}
                      onChangeText={(v) => updateSet(item.exerciseId, index, { rpe: v })}
                      keyboardType="decimal-pad"
                      editable={!set.confirmed}
                    />
                  </View>
                  <Button
                    label={set.confirmed ? 'Done' : 'Confirm'}
                    variant={set.confirmed ? 'secondary' : 'primary'}
                    disabled={set.confirmed}
                    onPress={() => confirmSet(item.exerciseId, index)}
                  />
                </View>
              ))}
            </Card>
          </Pressable>
        );
      })}

      <Button label="Finish workout" onPress={onFinish} />

      <Modal visible={finishModalOpen} transparent animationType="slide" onRequestClose={() => setFinishModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Card style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <Typography variant="title">Finish workout</Typography>
            <TextField label="Notes (optional)" value={finishNotes} onChangeText={setFinishNotes} multiline />
            <Button label="Save & finish" onPress={() => finishAndClose(finishNotes.trim() || null)} />
            <Button variant="secondary" label="Skip" onPress={() => finishAndClose(null)} />
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  restCard: {
    gap: spacing.xs,
  },
  exerciseCard: {
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  setLabel: {
    width: 48,
  },
  setInput: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.sm,
  },
});
