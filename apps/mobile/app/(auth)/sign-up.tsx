import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Button, KeyboardAwareScreen, TextField, Typography, type TextFieldHandle } from '../../src/design';
import { useAuthStore } from '../../src/features/account/useAuthStore';

export default function SignUpScreen() {
  const registerAndLogin = useAuthStore((s) => s.registerAndLogin);
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<TextFieldHandle>(null);
  const passwordRef = useRef<TextFieldHandle>(null);

  const onSubmit = async () => {
    if (submitting) return;
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
    <KeyboardAwareScreen>
      <TextField
        label="Invite code"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
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
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={() => void onSubmit()}
      />
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
    </KeyboardAwareScreen>
  );
}
