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

export default function LogInScreen() {
  const { colors } = useTheme();
  const login = useAuthStore((s) => s.login);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextFieldHandle>(null);

  const onSubmit = async () => {
    if (submitting) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSubmit = async () => {
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      const google = await signInWithGoogle();
      // Null means the user dismissed the Google picker — not an error to report back.
      if (!google) return;
      await googleLogin(google.idToken);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <AuthBrandHeader />

      <View style={styles.headings}>
        <Typography variant="bodyStrong" color="accent">
          Welcome back
        </Typography>
        <Typography variant="headline">Your progress starts here.</Typography>
        <Typography variant="body" color="secondary">
          Sign in to continue your journey.
        </Typography>
      </View>

      <View style={styles.form}>
        <TextField
          label="Email"
          hideLabel
          leadingIcon="mail-outline"
          placeholder="name@example.com"
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
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
        />

        <Typography
          variant="caption"
          color="accent"
          style={styles.forgot}
          accessibilityRole="link"
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          Forgot password?
        </Typography>

        {error ? (
          <Typography variant="body" color="danger">
            {error}
          </Typography>
        ) : null}

        <Button label="Sign In" onPress={onSubmit} loading={submitting} />
      </View>

      <View style={styles.dividerRow}>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
        <Typography variant="caption" color="secondary">
          OR CONTINUE WITH
        </Typography>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.social}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: submitting, busy: submitting }}
          disabled={submitting}
          onPress={() => void onGoogleSubmit()}
          style={({ pressed }) => [
            styles.socialButton,
            { borderColor: colors.border, opacity: submitting ? 0.45 : pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="logo-google" size={18} color={String(colors.textSecondary)} />
          <Typography variant="caption" color="secondary">
            Continue with Google
          </Typography>
        </Pressable>
      </View>

      <View style={styles.footerRow}>
        <Typography variant="body" color="secondary">
          New to FitTrack?{' '}
        </Typography>
        <Typography
          variant="body"
          color="accent"
          accessibilityRole="link"
          onPress={() => router.push('/(auth)/sign-up')}
        >
          Create account
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
  forgot: {
    alignSelf: 'flex-end',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  social: {
    gap: spacing.sm,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 48,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
