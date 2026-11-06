import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { radius, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

export function QuickAddButton() {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Quick add"
      onPress={() => router.push('/quick-add')}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Typography variant="headline" style={{ color: colors.accentOn, lineHeight: 28 }}>
        +
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
