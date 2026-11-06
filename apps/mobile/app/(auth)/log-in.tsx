import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, spacing, TextField, Typography, useTheme } from '../../src/design';
import { useAuthStore } from '../../src/features/account/useAuthStore';

export default function LogInScreen() {
  const { colors } = useTheme();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? (
        <Typography variant="body" color="danger">
          {error}
        </Typography>
      ) : null}
      <Button label={submitting ? 'Logging in…' : 'Log in'} onPress={onSubmit} disabled={submitting} />
      <Typography
        variant="body"
        color="accent"
        onPress={() => router.push('/(auth)/forgot-password')}
      >
        Forgot password?
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
