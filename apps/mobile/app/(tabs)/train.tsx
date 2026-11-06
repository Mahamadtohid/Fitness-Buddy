import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, radius, spacing, Typography, useTheme } from '../../src/design';
import { getSchedule, setScheduleDay } from '../../src/data/repositories/scheduleRepository';
import { listTemplates } from '../../src/data/repositories/workoutTemplateRepository';
import type { ScheduleEntryRow, WorkoutTemplateRow } from '../../src/data/db/schema';

/** Matches `Date.prototype.getDay()`: 0 = Sunday .. 6 = Saturday. */
const WEEKDAYS: { weekday: number; label: string }[] = [
  { weekday: 1, label: 'Monday' },
  { weekday: 2, label: 'Tuesday' },
  { weekday: 3, label: 'Wednesday' },
  { weekday: 4, label: 'Thursday' },
  { weekday: 5, label: 'Friday' },
  { weekday: 6, label: 'Saturday' },
  { weekday: 0, label: 'Sunday' },
];

type PickerMode = { kind: 'schedule'; weekday: number } | { kind: 'start' };

export default function TrainScreen() {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<WorkoutTemplateRow[]>(() => listTemplates());
  const [schedule, setSchedule] = useState<ScheduleEntryRow[]>(() => getSchedule());
  const [picker, setPicker] = useState<PickerMode | null>(null);

  const refresh = useCallback(() => {
    setTemplates(listTemplates());
    setSchedule(getSchedule());
  }, []);

  useFocusEffect(refresh);

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="headline">Train</Typography>

      <Typography variant="title">This week</Typography>
      {WEEKDAYS.map(({ weekday, label }) => (
        <Pressable key={weekday} onPress={() => setPicker({ kind: 'schedule', weekday })}>
          <Card style={styles.row}>
            <Typography variant="bodyStrong">{label}</Typography>
            <Typography variant="body" color="secondary">
              {templateNameFor(scheduledTemplateIdFor(weekday))}
            </Typography>
          </Card>
        </Pressable>
      ))}

      <Typography variant="title">Start a workout</Typography>
      <Button label="Choose a template" onPress={() => setPicker({ kind: 'start' })} />

      <Button
        variant="secondary"
        label="Exercise library"
        onPress={() => router.push('/exercise-library')}
      />

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
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
