import { useState } from 'react';

import { Button, KeyboardAwareScreen, TextField, Typography } from '../../src/design';
import { client } from '../../src/data/api/client';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (submitting || !email.trim()) return;
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
    <KeyboardAwareScreen>
      <Typography variant="body" color="secondary">
        We will email you a link to reset your password.
      </Typography>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!sent}
        returnKeyType="go"
        onSubmitEditing={() => void onSubmit()}
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
          label="Send reset link"
          onPress={onSubmit}
          loading={submitting}
          disabled={!email.trim()}
        />
      )}
    </KeyboardAwareScreen>
  );
}
