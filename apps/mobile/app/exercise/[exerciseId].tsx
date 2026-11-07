import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, LineChart, spacing, Typography, useTheme } from '../../src/design';
import { listExercisesByMuscleGroup } from '../../src/data/repositories/exerciseRepository';
import { historyForExercise } from '../../src/data/repositories/setEntryRepository';
import { estimatedOneRepMax, isPersonalRecord } from '../../src/domain/oneRepMax';

/** Short "M/D" label for a "YYYY-MM-DD" local date — UTC-midnight parsing + UTC getters so this
 * round-trips correctly regardless of the device's own timezone (same approach documented on
 * `src/platform/localDate.ts#getLocalDateString`). */
function formatShortDate(localDate: string): string {
  const date = new Date(`${localDate}T00:00:00Z`);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

export default function ExerciseHistoryScreen() {
  const { colors } = useTheme();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  const exercise = useMemo(
    () => Object.values(listExercisesByMuscleGroup()).flat().find((e) => e.id === exerciseId),
    [exerciseId],
  );

  // Full per-set, chronological (oldest first) history — also the exact shape/order
  // `isPersonalRecord` expects, so PR badges below are computed directly against this array.
  const history = useMemo(() => (exerciseId ? historyForExercise(exerciseId) : []), [exerciseId]);

  // Best (max) estimated 1RM per session for the chart. `historyForExercise` returns each set's
  // session `localDate` rather than a session id, so sets are grouped by date here — two sessions
  // on the same calendar day would collapse into one point, which is an accepted limitation of
  // the per-set shape this is built on.
  const chartPoints = useMemo(() => {
    const bestByDate = new Map<string, number>();
    const datesInOrder: string[] = [];
    for (const set of history) {
      const e1rm = estimatedOneRepMax(set.weightKg, set.reps);
      if (!bestByDate.has(set.localDate)) datesInOrder.push(set.localDate);
      bestByDate.set(set.localDate, Math.max(bestByDate.get(set.localDate) ?? -Infinity, e1rm));
    }
    return datesInOrder.map((localDate) => ({
      label: formatShortDate(localDate),
      value: Math.round(bestByDate.get(localDate) ?? 0),
    }));
  }, [history]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="headline">{exercise?.name ?? 'Exercise history'}</Typography>

      <Card style={styles.chartCard}>
        <Typography variant="title">Estimated 1RM</Typography>
        <LineChart points={chartPoints} />
      </Card>

      <Typography variant="title">All sets</Typography>
      {history.length === 0 ? (
        <Typography variant="body" color="secondary">
          No sets logged for this exercise yet.
        </Typography>
      ) : (
        history.map((set, index) => {
          const pr = isPersonalRecord(history, index);
          return (
            <Card key={index} style={styles.setRow}>
              <View style={styles.setRowLeft}>
                <Typography variant="bodyStrong">
                  {set.weightKg}kg × {set.reps}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {formatShortDate(set.localDate)}
                  {set.rpe !== null ? ` · RPE ${set.rpe}` : ''}
                </Typography>
              </View>
              {pr ? (
                <Typography variant="caption" color="accent">
                  ★ PR
                </Typography>
              ) : null}
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  chartCard: {
    gap: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setRowLeft: {
    gap: spacing.xs / 2,
  },
});
