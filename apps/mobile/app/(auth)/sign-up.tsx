import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Button,
  KeyboardAwareScreen,
  spacing,
  TextField,
  Typography,
  useTheme,
  type TextFieldHandle,
} from '../../src/design';
import { AuthBrandHeader } from '../../src/features/account/components/AuthBrandHeader';
import { signInWithGoogle } from '../../src/features/account/googleSignIn';
import { useAuthStore } from '../../src/features/account/useAuthStore';

const MIN_PASSWORD_LENGTH = 8;

export default function SignUpScreen() {
  const { colors } = useTheme();
  const registerAndLogin = useAuthStore((s) => s.registerAndLogin);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const inviteRef = useRef<TextFieldHandle>(null);
  const emailRef = useRef<TextFieldHandle>(null);
  const passwordRef = useRef<TextFieldHandle>(null);
  const confirmRef = useRef<TextFieldHandle>(null);

  /** Checked before anything is sent, so the user gets the specific problem rather than a generic
   * server rejection (the mockup's implementation note asks for validated inputs). */
  function validationError(): string | null {
    if (!fullName.trim()) return 'Enter your full name.';
    if (!inviteCode.trim()) return 'An invite code is required to create an account.';
    if (!email.trim()) return 'Enter your email address.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!acceptedTerms) return 'Please accept the Terms of Service and Privacy Policy.';
    return null;
  }

  const onSubmit = async () => {
    if (submitting) return;

    const problem = validationError();
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await registerAndLogin(email.trim(), password, inviteCode.trim(), fullName.trim());
      router.push('/(auth)/consent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSubmit = async () => {
    if (submitting || googleSubmitting) return;
    if (!inviteCode.trim()) {
      setError('An invite code is required to create an account with Google.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setError(null);
    setGoogleSubmitting(true);
    try {
      const google = await signInWithGoogle();
      // Null means the user dismissed the Google picker — not an error to report back.
      if (!google) return;
      const isNewUser = await googleLogin(google.idToken, inviteCode.trim());
      router.replace(isNewUser ? '/(auth)/consent' : '/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <AuthBrandHeader />

      <View style={styles.headings}>
        <Typography variant="headline">Build a stronger you.</Typography>
        <Typography variant="body" color="secondary">
          Create your account and make every day count.
        </Typography>
      </View>

      <View style={styles.form}>
        <TextField
          label="Full name"
          hideLabel
          leadingIcon="person-outline"
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          autoComplete="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => inviteRef.current?.focus()}
        />
        <TextField
          ref={inviteRef}
          label="Invite code"
          hideLabel
          leadingIcon="ticket-outline"
          placeholder="Invite code"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <TextField
          ref={emailRef}
          label="Email address"
          hideLabel
          leadingIcon="mail-outline"
          placeholder="Email address"
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
          hideLabel
          leadingIcon="lock-closed-outline"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <TextField
          ref={confirmRef}
          label="Confirm password"
          hideLabel
          leadingIcon="lock-closed-outline"
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
        />

        <Pressable
          style={styles.termsRow}
          onPress={() => setAcceptedTerms((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
        >
          <Ionicons
            name={acceptedTerms ? 'checkbox' : 'square-outline'}
            size={22}
            color={String(acceptedTerms ? colors.accent : colors.textSecondary)}
          />
          <Typography variant="caption" color="secondary" style={styles.termsText}>
            I agree to the Terms of Service and Privacy Policy
          </Typography>
        </Pressable>

        {error ? (
          <Typography variant="body" color="danger">
            {error}
          </Typography>
        ) : null}

        <Button
          label="Create Account"
          onPress={onSubmit}
          loading={submitting}
          disabled={googleSubmitting}
        />
        <Button
          label="Continue with Google"
          variant="secondary"
          onPress={() => void onGoogleSubmit()}
          loading={googleSubmitting}
          disabled={submitting}
        />
      </View>

      <View style={styles.footerRow}>
        <Typography variant="body" color="secondary">
          Already have an account?{' '}
        </Typography>
        <Typography
          variant="body"
          color="accent"
          accessibilityRole="link"
          onPress={() => router.replace('/(auth)/log-in')}
        >
          Sign in
        </Typography>
      </View>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  headings: {
    gap: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  termsText: {
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
