import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';

import { radius, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, variant = 'primary', style, ...rest }: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary ? colors.accent : colors.surfaceAlt,
          opacity: pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      <Typography
        variant="bodyStrong"
        style={{ color: isPrimary ? colors.accentOn : colors.textPrimary }}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
