import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, spacing, TextField, Typography, useTheme } from '../../src/design';
import { useAuthStore } from '../../src/features/account/useAuthStore';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const registerAndLogin = useAuthStore((s) => s.registerAndLogin);
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await registerAndLogin(email, password, inviteCode);
      router.push('/(auth)/consent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextField
        label="Invite code"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
      />
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
      <Button
        label={submitting ? 'Creating account…' : 'Create account'}
        onPress={onSubmit}
        disabled={submitting}
      />
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
