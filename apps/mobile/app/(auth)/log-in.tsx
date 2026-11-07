import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Button, KeyboardAwareScreen, TextField, Typography, type TextFieldHandle } from '../../src/design';
import { useAuthStore } from '../../src/features/account/useAuthStore';

export default function LogInScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextFieldHandle>(null);

  const onSubmit = async () => {
    if (submitting) return;
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
    <KeyboardAwareScreen>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={() => void onSubmit()}
      />
      {error ? (
        <Typography variant="body" color="danger">
          {error}
        </Typography>
      ) : null}
      <Button label="Log in" onPress={onSubmit} loading={submitting} />
      <Typography
        variant="body"
        color="accent"
        onPress={() => router.push('/(auth)/forgot-password')}
      >
        Forgot password?
      </Typography>
    </KeyboardAwareScreen>
  );
}
