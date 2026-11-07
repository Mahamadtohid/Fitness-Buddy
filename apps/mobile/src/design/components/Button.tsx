import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet } from 'react-native';

import { radius, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
  /** Shows a spinner beside the label and blocks presses — FitTrack guidelines §11 ask for a real
   * loading state and for double taps to be prevented during network submissions. Screens should
   * pass this rather than swapping the label for "Saving…" text, so the button keeps a stable
   * label and the busy state is announced to screen readers. */
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading = false, disabled, style, ...rest }: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled === true || loading;
  const contentColor = isPrimary ? colors.accentOn : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary ? colors.accent : colors.surfaceAlt,
          // §11 wants a visible disabled state: previously a disabled button looked identical to
          // an enabled one and simply ignored taps, which reads as the app being broken.
          opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? undefined : style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator size="small" color={contentColor} /> : null}
      <Typography variant="bodyStrong" style={{ color: contentColor }}>
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
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
