import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Pill-style two-or-more-option toggle (Train's "This week / Rest day" in the reference UI
 * mockup). No new dependency — plain Pressable + theme colors, same spirit as Button/Card. */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active ? { backgroundColor: colors.surface } : null]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Typography variant="bodyStrong" color={active ? 'accent' : 'secondary'}>
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
});
