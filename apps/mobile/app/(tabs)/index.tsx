import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, radius, spacing, TextField, Typography, useTheme } from '../../src/design';
import { getTodaySummary, type TodaySummary } from '../../src/data/repositories/todaySummary';
import { logWater } from '../../src/data/repositories/waterEntryRepository';
import { logWeight } from '../../src/data/repositories/weightEntryRepository';
import { getSchedule } from '../../src/data/repositories/scheduleRepository';
import { retryNow, useSyncStatusStore } from '../../src/data/sync';
import { getLocalDateString } from '../../src/platform/localDate';

/** Matches `Date.prototype.getDay()` convention used by scheduleRepository/train.tsx. */
function weekdayOf(localDate: string): number {
  return new Date(`${localDate}T00:00:00Z`).getUTCDay();
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Bar({ value, target }: { value: number; target: number }) {
  const { colors } = useTheme();
  const pct = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
  return (
    <View style={[styles.barTrack, { backgroundColor: colors.surfaceAlt }]}>
      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: colors.accent }]} />
    </View>
  );
}

/**
 * Minimal Today dashboard (PRD §3.7) — rings/water bar/workout card/weigh-in prompt/week
 * strip/sync status, all sourced from `todaySummary.ts`. The weekly adaptive check-in (§4.4) is
 * explicitly PRD's own Phase 5, not built here.
 */
export default function TodayScreen() {
  const { colors } = useTheme();
  const { status, lastError } = useSyncStatusStore();
  const [summary, setSummary] = useState<TodaySummary>(() => getTodaySummary());
  const [weightInput, setWeightInput] = useState('');
  const [customWater, setCustomWater] = useState('');

  const refresh = useCallback(() => setSummary(getTodaySummary()), []);
  useFocusEffect(refresh);

  const today = getLocalDateString();
  const weekday = weekdayOf(today);
  const scheduledTemplateId = getSchedule().find((s) => s.weekday === weekday && !s.deletedAt)?.templateId ?? null;

  const onAddWater = (ml: number) => {
    logWater(ml);
    refresh();
  };

  const onCustomWater = () => {
    const ml = Number(customWater);
    if (!Number.isFinite(ml) || ml <= 0) return;
    logWater(ml);
    setCustomWater('');
    refresh();
  };

  const onLogWeight = () => {
    const weightKg = Number(weightInput);
    if (!Number.isFinite(weightKg) || weightKg <= 0) return;
    logWeight(today, weightKg);
    setWeightInput('');
    refresh();
  };

  const onStartWorkout = () => {
    if (!scheduledTemplateId) return;
    router.push({ pathname: '/active-workout', params: { templateId: scheduledTemplateId } });
  };

  const onSyncNow = () => {
    retryNow();
    refresh();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="headline">Today</Typography>

      <Card style={styles.sectionCard}>
        <Typography variant="bodyStrong">
          Calories: {Math.round(summary.calories.eaten)} / {Math.round(summary.calories.target)} kcal
        </Typography>
        <Bar value={summary.calories.eaten} target={summary.calories.target} />
        <Typography variant="bodyStrong">
          Protein: {Math.round(summary.protein.eatenG)} / {Math.round(summary.protein.targetG)} g
        </Typography>
        <Bar value={summary.protein.eatenG} target={summary.protein.targetG} />
      </Card>

      <Card style={styles.sectionCard}>
        <Typography variant="bodyStrong">
          Water: {summary.water.totalMl} / {Math.round(summary.water.targetMl)} ml
        </Typography>
        <Bar value={summary.water.totalMl} target={summary.water.targetMl} />
        <View style={styles.row}>
          <Button variant="secondary" label="+250 ml" onPress={() => onAddWater(250)} />
          <Button variant="secondary" label="+500 ml" onPress={() => onAddWater(500)} />
        </View>
        <View style={styles.row}>
          <View style={styles.flexInput}>
            <TextField label="Custom (ml)" value={customWater} onChangeText={setCustomWater} keyboardType="number-pad" />
          </View>
          <Button label="Add" onPress={onCustomWater} />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Typography variant="bodyStrong">
          {summary.workout.scheduledTemplateName ? `Today: ${summary.workout.scheduledTemplateName}` : 'Rest day'}
        </Typography>
        {summary.workout.loggedToday ? (
          <Typography variant="caption" color="secondary">
            Workout logged today
          </Typography>
        ) : scheduledTemplateId ? (
          <Button label="Start workout" onPress={onStartWorkout} />
        ) : null}
      </Card>

      {!summary.weighInLoggedToday ? (
        <Card style={styles.sectionCard}>
          <Typography variant="bodyStrong">Log today&apos;s weigh-in</Typography>
          <View style={styles.row}>
            <View style={styles.flexInput}>
              <TextField label="Weight (kg)" value={weightInput} onChangeText={setWeightInput} keyboardType="decimal-pad" />
            </View>
            <Button label="Log" onPress={onLogWeight} />
          </View>
        </Card>
      ) : null}

      <Card style={styles.sectionCard}>
        <Typography variant="bodyStrong">This week</Typography>
        <View style={styles.weekStripRow}>
          {summary.weekStrip.map((day) => (
            <View key={day.localDate} style={styles.weekStripDay}>
              <Typography variant="caption" color="secondary">
                {WEEKDAY_LETTERS[weekdayOf(day.localDate)]}
              </Typography>
              <Typography variant="caption" color={day.trained ? 'accent' : 'secondary'}>
                W
              </Typography>
              <Typography variant="caption" color={day.foodLogged ? 'accent' : 'secondary'}>
                F
              </Typography>
              <Typography variant="caption" color={day.proteinHit ? 'accent' : 'secondary'}>
                P
              </Typography>
            </View>
          ))}
        </View>
        <Typography variant="caption" color="secondary">
          W = trained · F = food logged · P = protein within 10% of target
        </Typography>
      </Card>

      <Card style={styles.sectionCard}>
        <Typography variant="bodyStrong">Sync: {status}</Typography>
        {lastError ? (
          <Typography variant="caption" color="danger">
            {lastError}
          </Typography>
        ) : null}
        <Button variant="secondary" label="Sync now" onPress={onSyncNow} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  sectionCard: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  flexInput: { flex: 1 },
  barTrack: { height: 10, borderRadius: radius.sm, overflow: 'hidden' },
  barFill: { height: '100%' },
  weekStripRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekStripDay: { alignItems: 'center', gap: 2 },
});
