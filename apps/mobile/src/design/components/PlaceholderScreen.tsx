import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import { spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

type Props = {
  title: string;
  comingInPhase: string;
};

export function PlaceholderScreen({ title, comingInPhase }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Typography variant="headline">{title}</Typography>
      <Typography variant="body" color="secondary" style={styles.subtitle}>
        {comingInPhase}
      </Typography>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
  },
});
