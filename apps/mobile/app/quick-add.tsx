import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Card, spacing, Typography, useTheme } from '../src/design';

/**
 * PRD §5's quick-add sheet: each option jumps to where that action actually lives today (weigh-in
 * on Progress, water on Today, saved-meal/food-search on Food, a template picker on Train) rather
 * than duplicating that logic here. Previously these were static, non-interactive cards with no
 * `onPress` at all — a completely dead PRD-named UI element.
 */
const QUICK_ADD_OPTIONS: { label: string; route: '/(tabs)/progress' | '/(tabs)' | '/(tabs)/food' | '/(tabs)/train' }[] = [
  { label: 'Weight', route: '/(tabs)/progress' },
  { label: 'Water', route: '/(tabs)' },
  { label: 'Saved meal', route: '/(tabs)/food' },
  { label: 'Food search', route: '/(tabs)/food' },
  { label: 'Start workout', route: '/(tabs)/train' },
];

export default function QuickAddSheet() {
  const { colors } = useTheme();

  const onSelect = (route: (typeof QUICK_ADD_OPTIONS)[number]['route']) => {
    router.replace(route);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {QUICK_ADD_OPTIONS.map((option) => (
        <Pressable key={option.label} onPress={() => onSelect(option.route)}>
          <Card style={styles.option}>
            <Typography variant="bodyStrong">{option.label}</Typography>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  option: {
    marginBottom: spacing.sm,
  },
});
