import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, spacing, Typography, useTheme } from '../../src/design';

export default function ConsentScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Typography variant="title">Before you start</Typography>
      <Typography variant="body" color="secondary" style={styles.body}>
        Fitness Companion stores health-related personal data (workouts, food, weight, water) in
        your account so it can sync across your devices. Read the privacy policy before
        continuing.
      </Typography>
      <Button label="I agree, continue" onPress={() => router.replace('/(tabs)')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.md,
  },
  body: {
    marginBottom: spacing.md,
  },
});
