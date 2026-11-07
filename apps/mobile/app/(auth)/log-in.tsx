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
import { useAuthStore } from '../../src/features/account/useAuthStore';

/** Social providers from the UI mockup. The backend has no OAuth — it authenticates with email +
 * password + invite code only — so these are rendered in their designed place but disabled, rather
 * than as controls that look live and then fail (guidelines §6.2: don't add providers without
 * backend support). */
const SOCIAL_PROVIDERS: { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Continue with Google', icon: 'logo-google' },
  { label: 'Continue with Apple', icon: 'logo-apple' },
];

export default function LogInScreen() {
  const { colors } = useTheme();
  const login = useAuthStore((s) => s.login);
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
        {SOCIAL_PROVIDERS.map((provider) => (
          <Pressable
            key={provider.label}
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            accessibilityHint="Not available yet"
            style={[styles.socialButton, { borderColor: colors.border }]}
          >
            <Ionicons name={provider.icon} size={18} color={String(colors.textSecondary)} />
            <Typography variant="caption" color="secondary">
              {provider.label}
            </Typography>
          </Pressable>
        ))}
      </View>
      <Typography variant="caption" color="secondary" style={styles.socialNote}>
        Social sign-in is coming soon.
      </Typography>

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
    opacity: 0.55,
  },
  socialNote: {
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
