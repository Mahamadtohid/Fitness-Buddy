import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Button, Card, CircularProgress, radius, spacing, TextField, Typography, useTheme } from '../../src/design';
import { getTodaySummary, type TodaySummary } from '../../src/data/repositories/todaySummary';
import { logWater } from '../../src/data/repositories/waterEntryRepository';
import { logWeight } from '../../src/data/repositories/weightEntryRepository';
import { getSchedule } from '../../src/data/repositories/scheduleRepository';
import { getProfile } from '../../src/data/repositories/profileRepository';
import { retryNow, useSyncStatusStore } from '../../src/data/sync';
import { getLocalDateString } from '../../src/platform/localDate';
import { parseWeightInput, type Units } from '../../src/domain/units';

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

/** One calorie/protein ring card (reference UI mockup's two side-by-side stat cards). */
function RingStat({
  label,
  eaten,
  target,
  unit,
}: {
  label: string;
  eaten: number;
  target: number;
  unit: string;
}) {
  const left = Math.max(0, Math.round(target) - Math.round(eaten));
  return (
    <Card style={styles.ringCard}>
      <Typography variant="bodyStrong">{label}</Typography>
      <CircularProgress value={eaten} max={target} size={104} strokeWidth={10}>
        <Typography variant="statLarge">{Math.round(eaten)}</Typography>
        <Typography variant="statUnit" color="secondary">
          / {Math.round(target)} {unit}
        </Typography>
      </CircularProgress>
      <Typography variant="caption" color="secondary">
        {left} {unit} left
      </Typography>
    </Card>
  );
}

/**
 * Today dashboard (PRD §3.7) — rings/water bar/workout card/weigh-in prompt/week strip/sync
 * status, all sourced from `todaySummary.ts`. Visually matches the reference UI mockup; the
 * weekly adaptive check-in (§4.4) is explicitly PRD's own Phase 5, not built here.
 */
export default function TodayScreen() {
  const { colors } = useTheme();
  const { status, lastError } = useSyncStatusStore();
  const today = getLocalDateString();
  const weekday = weekdayOf(today);

  function scheduledTemplateIdFor(day: number): string | null {
    return getSchedule().find((s) => s.weekday === day && !s.deletedAt)?.templateId ?? null;
  }

  const [summary, setSummary] = useState<TodaySummary>(() => getTodaySummary());
  // Queried once per refresh (focus/after an action), not on every render — this used to be a
  // live DB query (`getSchedule()`) called directly in the render body, so it re-ran on every
  // keystroke in this screen's two text fields too.
  const [scheduledTemplateId, setScheduledTemplateId] = useState<string | null>(() => scheduledTemplateIdFor(weekday));
  const [units, setUnits] = useState<Units>(() => (getProfile()?.units as Units) ?? 'metric');
  const [weightInput, setWeightInput] = useState('');
  const [customWater, setCustomWater] = useState('');
  const [customWaterOpen, setCustomWaterOpen] = useState(false);

  const refresh = useCallback(() => {
    setSummary(getTodaySummary());
    setScheduledTemplateId(scheduledTemplateIdFor(weekday));
    setUnits((getProfile()?.units as Units) ?? 'metric');
  }, [weekday]);
  useFocusEffect(refresh);

  const onAddWater = (ml: number) => {
    logWater(ml);
    refresh();
  };

  const onCustomWater = () => {
    const ml = Number(customWater);
    if (!Number.isFinite(ml) || ml <= 0) return;
    logWater(ml);
    setCustomWater('');
    setCustomWaterOpen(false);
    refresh();
  };

  const onLogWeight = () => {
    const weightKg = parseWeightInput(weightInput, units);
    if (!Number.isFinite(weightKg) || weightKg <= 0) return;
    logWeight(today, weightKg);
    setWeightInput('');
    refresh();
  };

  const canStartWorkout = Boolean(scheduledTemplateId) && !summary.workout.loggedToday;

  const onStartWorkout = () => {
    if (!scheduledTemplateId) return;
    router.push({ pathname: '/active-workout', params: { templateId: scheduledTemplateId } });
  };

  const onSyncNow = () => {
    retryNow();
    refresh();
  };

  const trainedCount = summary.weekStrip.filter((d) => d.trained).length;
  const foodLoggedCount = summary.weekStrip.filter((d) => d.foodLogged).length;

  const WorkoutCardContent = (
    <>
      <View style={styles.row}>
        <View style={[styles.workoutIconWrap, { backgroundColor: colors.background }]}>
          <MaterialCommunityIcons name="dumbbell" size={20} color={colors.accent} />
        </View>
        <View style={styles.flexInput}>
          <Typography variant="bodyStrong">
            {summary.workout.scheduledTemplateName ?? 'Rest day'}
          </Typography>
          <Typography variant="caption" color="secondary">
            {summary.workout.scheduledTemplateName ? "Today's session" : 'Recovery'}
          </Typography>
        </View>
        {canStartWorkout ? <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} /> : null}
      </View>
      {summary.workout.loggedToday ? (
        <Typography variant="caption" color="secondary">
          Workout logged today
        </Typography>
      ) : null}
    </>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Typography variant="headline">Today</Typography>
          <Typography variant="caption" color="secondary">
            {today}
          </Typography>
        </View>
        <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
      </View>

      <View style={styles.row}>
        <RingStat label="Calories" eaten={summary.calories.eaten} target={summary.calories.target} unit="kcal" />
        <RingStat label="Protein" eaten={summary.protein.eatenG} target={summary.protein.targetG} unit="g" />
      </View>

      <Card style={styles.sectionCard}>
        <View style={styles.row}>
          <Ionicons name="water-outline" size={18} color={colors.accent} />
          <Typography variant="bodyStrong">
            {summary.water.totalMl} / {Math.round(summary.water.targetMl)} ml
          </Typography>
        </View>
        <Bar value={summary.water.totalMl} target={summary.water.targetMl} />
        <View style={styles.row}>
          <Button variant="secondary" label="+250 ml" onPress={() => onAddWater(250)} />
          <Button variant="secondary" label="+500 ml" onPress={() => onAddWater(500)} />
          <Button
            variant="secondary"
            label="Custom"
            onPress={() => setCustomWaterOpen((v) => !v)}
          />
        </View>
        {customWaterOpen ? (
          <View style={styles.row}>
            <View style={styles.flexInput}>
              <TextField label="Custom (ml)" value={customWater} onChangeText={setCustomWater} keyboardType="number-pad" />
            </View>
            <Button label="Add" onPress={onCustomWater} />
          </View>
        ) : null}
      </Card>

      {canStartWorkout ? (
        <Pressable onPress={onStartWorkout}>
          <Card style={[styles.sectionCard, styles.workoutCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.accent }]}>
            {WorkoutCardContent}
          </Card>
        </Pressable>
      ) : (
        <Card style={[styles.sectionCard, styles.workoutCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.accent }]}>
          {WorkoutCardContent}
        </Card>
      )}

      {!summary.weighInLoggedToday ? (
        <Card style={styles.sectionCard}>
          <Typography variant="bodyStrong">Log today&apos;s weigh-in</Typography>
          <View style={styles.row}>
            <View style={styles.flexInput}>
              <TextField
                label={units === 'imperial' ? 'Weight (lb)' : 'Weight (kg)'}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
              />
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
              <Ionicons
                name={day.trained ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={day.trained ? colors.accent : colors.textSecondary}
              />
            </View>
          ))}
        </View>
        <Typography variant="caption" color="secondary">
          {trainedCount} workouts · {foodLoggedCount}/7 days logged
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionCard: { gap: spacing.xs },
  ringCard: { flex: 1, alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  flexInput: { flex: 1 },
  barTrack: { height: 10, borderRadius: radius.sm, overflow: 'hidden' },
  barFill: { height: '100%' },
  weekStripRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekStripDay: { alignItems: 'center', gap: 4 },
  workoutCard: { borderWidth: 1 },
  workoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
