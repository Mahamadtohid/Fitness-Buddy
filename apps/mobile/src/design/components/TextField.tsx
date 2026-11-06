import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { radius, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

type Props = TextInputProps & {
  label: string;
};

export function TextField({ label, style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    fontSize: 16,
  },
});
