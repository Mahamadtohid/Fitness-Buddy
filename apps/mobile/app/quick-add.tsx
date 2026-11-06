import { StyleSheet, View } from 'react-native';

import { Card, spacing, Typography, useTheme } from '../src/design';

const QUICK_ADD_OPTIONS = ['Weight', 'Water', 'Saved meal', 'Food search', 'Start workout'];

export default function QuickAddSheet() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {QUICK_ADD_OPTIONS.map((option) => (
        <Card key={option} style={styles.option}>
          <Typography variant="bodyStrong">{option}</Typography>
        </Card>
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
