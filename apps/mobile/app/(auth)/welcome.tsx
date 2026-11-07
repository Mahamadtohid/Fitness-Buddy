import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, spacing, Typography, useTheme } from '../../src/design';

export default function WelcomeScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Typography variant="headline">FitTrack</Typography>
      <Typography variant="bodyStrong" color="accent" style={styles.tagline}>
        Train. Fuel. Progress.
      </Typography>
      <Typography variant="body" color="secondary" style={styles.subtitle}>
        Workouts, food, weight and water — in one place.
      </Typography>
      <View style={styles.actions}>
        <Button label="Sign up with invite code" onPress={() => router.push('/(auth)/sign-up')} />
        <Button
          label="Log in"
          variant="secondary"
          onPress={() => router.push('/(auth)/log-in')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  tagline: {
    marginTop: spacing.xs,
  },
  subtitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.sm,
  },
});
