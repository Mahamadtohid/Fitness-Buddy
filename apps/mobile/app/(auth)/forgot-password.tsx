import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, spacing, TextField, Typography, useTheme } from '../../src/design';
import { client } from '../../src/data/api/client';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await client.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Typography variant="body" color="secondary">
        We will email you a link to reset your password.
      </Typography>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!sent}
      />
      {error ? (
        <Typography variant="body" color="danger">
          {error}
        </Typography>
      ) : null}
      {sent ? (
        <Typography variant="body" color="secondary">
          If that email has an account, a reset link is on its way.
        </Typography>
      ) : (
        <Button
          label={submitting ? 'Sending…' : 'Send reset link'}
          onPress={onSubmit}
          disabled={submitting || !email.trim()}
        />
      )}
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
