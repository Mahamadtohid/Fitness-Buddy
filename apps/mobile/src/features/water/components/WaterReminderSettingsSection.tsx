import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, spacing, TextField, Typography } from '../../../design';
import { getSettings, saveSettings } from '../../../data/repositories/notificationSettingsRepository';
import { rescheduleWaterReminders } from '../../../platform/notifications';

type ToggleOption = { enabled: boolean; label: string };

const TOGGLE_OPTIONS: ToggleOption[] = [
  { enabled: true, label: 'On' },
  { enabled: false, label: 'Off' },
];

/**
 * Settings UI for the "water reminders every 2 hours between waking hours" feature (reads/writes
 * via `notificationSettingsRepository`, local-only — see that repository and `schema.ts`'s
 * `notificationSettings` table doc comment). Not wired into `app/(tabs)/settings.tsx` by this
 * file — exported for another process to import and render there.
 */
export function WaterReminderSettingsSection() {
  const [settings, setSettings] = useState(() => getSettings());
  const [wakeHourInput, setWakeHourInput] = useState(String(settings.wakeHour));
  const [sleepHourInput, setSleepHourInput] = useState(String(settings.sleepHour));

  const persist = (next: { enabled: boolean; wakeHour: number; sleepHour: number }) => {
    saveSettings(next);
    setSettings(getSettings());
    void rescheduleWaterReminders();
  };

  const onToggle = (enabled: boolean) => {
    persist({ enabled, wakeHour: settings.wakeHour, sleepHour: settings.sleepHour });
  };

  const onWakeHourBlur = () => {
    const wakeHour = Number(wakeHourInput);
    if (!Number.isFinite(wakeHour) || wakeHour < 0 || wakeHour > 23) {
      setWakeHourInput(String(settings.wakeHour));
      return;
    }
    persist({ enabled: settings.enabled, wakeHour: Math.round(wakeHour), sleepHour: settings.sleepHour });
  };

  const onSleepHourBlur = () => {
    const sleepHour = Number(sleepHourInput);
    if (!Number.isFinite(sleepHour) || sleepHour < 0 || sleepHour > 23) {
      setSleepHourInput(String(settings.sleepHour));
      return;
    }
    persist({ enabled: settings.enabled, wakeHour: settings.wakeHour, sleepHour: Math.round(sleepHour) });
  };

  return (
    <Card style={styles.card}>
      <Typography variant="title">Water reminders</Typography>
      <Typography variant="caption" color="secondary">
        A reminder every 2 hours between waking hours — skipped once today&apos;s water target is met.
      </Typography>
      <View style={styles.row}>
        {TOGGLE_OPTIONS.map((option) => (
          <Button
            key={String(option.enabled)}
            label={option.label}
            variant={settings.enabled === option.enabled ? 'primary' : 'secondary'}
            onPress={() => onToggle(option.enabled)}
          />
        ))}
      </View>
      <TextField
        label="Wake hour (0-23)"
        value={wakeHourInput}
        onChangeText={setWakeHourInput}
        onBlur={onWakeHourBlur}
        keyboardType="number-pad"
      />
      <TextField
        label="Sleep hour (0-23)"
        value={sleepHourInput}
        onChangeText={setSleepHourInput}
        onBlur={onSleepHourBlur}
        keyboardType="number-pad"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
});
