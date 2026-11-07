import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, radius, SegmentedControl, screenPadding, spacing, Typography, useTheme } from '../../src/design';
import { getSchedule, setScheduleDay } from '../../src/data/repositories/scheduleRepository';
import { listTemplates } from '../../src/data/repositories/workoutTemplateRepository';
import { listExercisesByMuscleGroup } from '../../src/data/repositories/exerciseRepository';
import { hasSessionForDate } from '../../src/data/repositories/workoutSessionRepository';
import { getLocalDateString } from '../../src/platform/localDate';
import type { ScheduleEntryRow, WorkoutTemplateRow } from '../../src/data/db/schema';
import type { TemplateItem } from '../../src/data/repositories/workoutTemplateLogic';

/** Matches `Date.prototype.getDay()`: 0 = Sunday .. 6 = Saturday. */
const WEEKDAYS: { weekday: number; label: string }[] = [
  { weekday: 1, label: 'Mon' },
  { weekday: 2, label: 'Tue' },
  { weekday: 3, label: 'Wed' },
  { weekday: 4, label: 'Thu' },
  { weekday: 5, label: 'Fri' },
  { weekday: 6, label: 'Sat' },
  { weekday: 0, label: 'Sun' },
];

type ViewMode = 'week' | 'restday';
const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'restday', label: 'Rest day' },
];

type PickerMode = { kind: 'schedule'; weekday: number } | { kind: 'start' };

/** This local week's actual date for a given `Date.prototype.getDay()` weekday index — needed to
 * check whether that day's workout was actually completed (a schedule assignment alone doesn't
 * tell you that). Plain local Date arithmetic (not UTC-anchored) since "this week" is inherently
 * about the device's own calendar, matching `checkInRepository.ts#currentWeekWeekStart`'s approach. */
function dateForWeekdayThisWeek(targetWeekday: number): string {
  const now = new Date();
  const diff = targetWeekday - now.getDay();
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return getLocalDateString(d);
}

export default function TrainScreen() {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<WorkoutTemplateRow[]>(() => listTemplates());
  const [schedule, setSchedule] = useState<ScheduleEntryRow[]>(() => getSchedule());
  const [picker, setPicker] = useState<PickerMode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const refresh = useCallback(() => {
    setTemplates(listTemplates());
    setSchedule(getSchedule());
  }, []);

  useFocusEffect(refresh);

  // Exercise-id -> muscle group, built once per templates list change, used to derive each
  // template's "Chest • Shoulders • Triceps"-style subtitle (the reference UI mockup shows this;
  // the data model has no stored summary, so it's derived from the template's own exercise list).
  const muscleGroupById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of Object.values(listExercisesByMuscleGroup()).flat()) {
      map.set(row.id, row.muscleGroup);
    }
    return map;
  }, []);

  const muscleSummaryFor = (templateId: string | null): string | null => {
    if (!templateId) return null;
    const template = templates.find((t) => t.id === templateId);
    if (!template) return null;
    const items = JSON.parse(template.itemsJson) as TemplateItem[];
    const groups: string[] = [];
    for (const item of items) {
      const group = muscleGroupById.get(item.exerciseId);
      if (group && !groups.includes(group)) groups.push(group);
    }
    return groups.length > 0 ? groups.join(' · ') : null;
  };

  const templateNameFor = (templateId: string | null): string => {
    if (!templateId) return 'Rest day';
    return templates.find((t) => t.id === templateId)?.name ?? 'Rest day';
  };

  const scheduledTemplateIdFor = (weekday: number): string | null =>
    schedule.find((s) => s.weekday === weekday && !s.deletedAt)?.templateId ?? null;

  const onPickForSchedule = (templateId: string | null) => {
    if (picker?.kind !== 'schedule') return;
    setScheduleDay(picker.weekday, templateId);
    setSchedule(getSchedule());
    setPicker(null);
  };

  const onPickForStart = (templateId: string) => {
    setPicker(null);
    router.push({ pathname: '/active-workout', params: { templateId } });
  };

  const visibleWeekdays =
    viewMode === 'restday' ? WEEKDAYS.filter(({ weekday }) => scheduledTemplateIdFor(weekday) === null) : WEEKDAYS;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="headline">Train</Typography>
        <Pressable onPress={() => setPicker({ kind: 'start' })} hitSlop={8}>
          <Ionicons name="calendar-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <SegmentedControl options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />

      <View style={styles.list}>
        {visibleWeekdays.length === 0 ? (
          <Typography variant="caption" color="secondary">
            No rest days scheduled this week.
          </Typography>
        ) : (
          visibleWeekdays.map(({ weekday, label }) => {
            const templateId = scheduledTemplateIdFor(weekday);
            const isRestDay = templateId === null;
            const completed = !isRestDay && hasSessionForDate(dateForWeekdayThisWeek(weekday));
            const muscleSummary = muscleSummaryFor(templateId);

            return (
              <Pressable key={weekday} onPress={() => setPicker({ kind: 'schedule', weekday })}>
                <Card style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Typography variant="caption" color="secondary" style={styles.dayLabel}>
                      {label}
                    </Typography>
                    <View>
                      <Typography variant="bodyStrong">{templateNameFor(templateId)}</Typography>
                      {muscleSummary ? (
                        <Typography variant="caption" color="secondary">
                          {muscleSummary}
                        </Typography>
                      ) : isRestDay ? (
                        <Typography variant="caption" color="secondary">
                          Recovery
                        </Typography>
                      ) : null}
                    </View>
                  </View>
                  <Ionicons
                    name={completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={26}
                    color={completed ? colors.accent : colors.textSecondary}
                  />
                </Card>
              </Pressable>
            );
          })
        )}
      </View>

      <Typography variant="title">Start a workout</Typography>
      <Button label="Choose a template" onPress={() => setPicker({ kind: 'start' })} />

      <Button variant="secondary" label="Exercise library" onPress={() => router.push('/exercise-library')} />

      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={styles.modalBackdrop}>
          <Card style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <Typography variant="title">
              {picker?.kind === 'schedule' ? 'Assign a template' : 'Start which workout?'}
            </Typography>
            {picker?.kind === 'schedule' ? (
              <Pressable onPress={() => onPickForSchedule(null)} style={styles.modalRow}>
                <Typography variant="body">Rest day</Typography>
              </Pressable>
            ) : null}
            {templates.length === 0 ? (
              <Typography variant="body" color="secondary">
                No workout templates yet.
              </Typography>
            ) : null}
            {templates.map((template) => (
              <Pressable
                key={template.id}
                onPress={() =>
                  picker?.kind === 'schedule' ? onPickForSchedule(template.id) : onPickForStart(template.id)
                }
                style={[styles.modalRow, { borderTopColor: colors.border }]}
              >
                <Typography variant="body">{template.name}</Typography>
              </Pressable>
            ))}
            <Button variant="secondary" label="Cancel" onPress={() => setPicker(null)} />
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: screenPadding,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  dayLabel: {
    width: 36,
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
  modalRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
