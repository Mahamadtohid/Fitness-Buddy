import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

type Props = TextInputProps & {
  label: string;
};

/** The imperative handle a `TextInput` exposes (`focus()`, `blur()`, …) — not the same type as the
 * `TextInput` component itself under the new architecture, so callers chaining focus between
 * fields should type their refs with this rather than with `TextInput`. */
export type TextFieldHandle = React.ComponentRef<typeof TextInput>;

/** Reveal control sized so the tap target stays comfortable without crowding the text. */
const TOGGLE_WIDTH = 48;

export const TextField = forwardRef<TextFieldHandle, Props>(function TextField(
  { label, style, secureTextEntry, ...rest },
  ref,
) {
  const { colors } = useTheme();
  // FitTrack guidelines §6.2 require a show/hide control on password fields. Tracked here rather
  // than by the caller so every password field in the app gets it for free.
  const [revealed, setRevealed] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View style={styles.wrapper}>
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>
      <View style={styles.inputRow}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isPassword && !revealed}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface },
            isPassword ? { paddingRight: TOGGLE_WIDTH } : null,
            style,
          ]}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            style={styles.toggle}
            onPress={() => setRevealed((previous) => !previous)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={8}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={String(colors.textSecondary)}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  inputRow: {
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 16,
  },
  toggle: {
    position: 'absolute',
    right: 0,
    width: TOGGLE_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
