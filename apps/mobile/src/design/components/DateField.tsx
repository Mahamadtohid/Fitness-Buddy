import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { radius, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

type Props = {
  label: string;
  /** `YYYY-MM-DD`, or empty when nothing has been chosen yet. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

/** Formats a picked `Date` using its *local* calendar fields. Going through `toISOString()` would
 * shift the day backwards for anyone east of UTC — the same class of bug `platform/localDate.ts`
 * exists to prevent. */
function toLocalDateString(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses `YYYY-MM-DD` into a local-midnight `Date`, so the picker opens on the stored day rather
 * than one either side of it. */
function fromLocalDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Date input backed by the platform calendar/wheel picker rather than free typing — the user asked
 * for a calendar on date of birth, and it also removes a whole class of format errors that a text
 * field invites.
 */
export function DateField({ label, value, onChange, placeholder = 'Select a date', minimumDate, maximumDate }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = fromLocalDateString(value);

  return (
    <View style={styles.wrapper}>
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}: ${value}` : label}
        accessibilityHint="Opens a date picker"
        style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface }]}
      >
        <Ionicons name="calendar-outline" size={20} color={String(colors.accent)} />
        <Typography variant="body" color={value ? 'primary' : 'secondary'} style={styles.valueText}>
          {value || placeholder}
        </Typography>
      </Pressable>

      {open ? (
        <DateTimePicker
          value={selected ?? maximumDate ?? new Date()}
          mode="date"
          // Android shows a modal dialog that dismisses itself; iOS renders inline, so it stays
          // mounted until the user picks and is closed from the handler below.
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, date) => {
            if (Platform.OS !== 'ios') setOpen(false);
            if (event.type === 'dismissed') return;
            if (date) onChange(toLocalDateString(date));
          }}
        />
      ) : null}

      {open && Platform.OS === 'ios' ? (
        <Pressable onPress={() => setOpen(false)} accessibilityRole="button" style={styles.done}>
          <Typography variant="bodyStrong" color="accent">
            Done
          </Typography>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  valueText: {
    flex: 1,
  },
  done: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
