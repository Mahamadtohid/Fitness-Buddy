import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, View } from 'react-native';

import { Button, spacing, TextField, Typography, useTheme } from '../../../design';
import { useAppLockStore } from '../useAppLockStore';

/**
 * Full-screen overlay that locks the whole app (PRD app-lock feature — biometric/PIN, especially
 * to protect progress photos). Pure overlay: knows nothing about navigation/routing. Render it as
 * a sibling on top of the authenticated app's `<Stack>` (not in place of it) — see root layout.
 *
 * Renders nothing when app lock is off or the app is already unlocked, so it's always safe to
 * mount unconditionally inside the authenticated branch.
 */
export function AppLockGate() {
  const { colors } = useTheme();
  const enabled = useAppLockStore((s) => s.enabled);
  const isLocked = useAppLockStore((s) => s.isLocked);
  const lock = useAppLockStore((s) => s.lock);
  const unlockWithPin = useAppLockStore((s) => s.unlockWithPin);
  const unlockWithBiometric = useAppLockStore((s) => s.unlockWithBiometric);

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Guards against retrying the automatic biometric prompt more than once per lock — a ref
  // (rather than state) because flipping it never needs to trigger a re-render itself.
  const biometricTriedRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if ((nextState === 'background' || nextState === 'inactive') && enabled) {
        lock();
      }
    });
    return () => subscription.remove();
  }, [enabled, lock]);

  // OS-level protection, independent of `isLocked`: Android snapshots the app's last-shown
  // content for the recent-apps task switcher (and iOS does the equivalent for its app switcher)
  // at the compositor level, before any JS — including the AppState listener above — gets a
  // chance to run. So this must be active for the whole time app lock is enabled, not just while
  // currently locked, otherwise the snapshot race is unwinnable. Opt-in: only engaged while the
  // user has app lock turned on, and released the moment they turn it off.
  useEffect(() => {
    if (enabled) {
      void ScreenCapture.preventScreenCaptureAsync();
    } else {
      void ScreenCapture.allowScreenCaptureAsync();
    }
  }, [enabled]);

  // Try biometric automatically once when the overlay first appears, falling back to the PIN
  // field if it fails, isn't available, or the user cancels. Resets the guard once unlocked so
  // the next lock tries biometric again.
  useEffect(() => {
    if (!isLocked) {
      biometricTriedRef.current = false;
      return;
    }
    if (biometricTriedRef.current) return;
    biometricTriedRef.current = true;
    void unlockWithBiometric();
  }, [isLocked, unlockWithBiometric]);

  // Clear the PIN field/error once unlocked, so stale input isn't shown the next time the
  // overlay appears. Done during render (React's documented "adjusting state when a prop
  // changes" pattern) rather than in an effect, since it's resetting local state in response to
  // a prop/store change, not synchronizing with an external system.
  const [wasLocked, setWasLocked] = useState(isLocked);
  if (isLocked !== wasLocked) {
    setWasLocked(isLocked);
    if (!isLocked) {
      setPin('');
      setError(null);
    }
  }

  if (!enabled || !isLocked) return null;

  const onSubmitPin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const ok = await unlockWithPin(pin);
      if (!ok) {
        setError('Incorrect PIN — try again.');
        setPin('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onRetryBiometric = () => {
    setError(null);
    void unlockWithBiometric().then((ok) => {
      if (!ok) setError('Biometric unlock failed — enter your PIN instead.');
    });
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Typography variant="headline">App locked</Typography>
        <Typography variant="body" color="secondary">
          Unlock to continue — your progress photos and data are protected.
        </Typography>

        <Button label="Unlock with Face ID / Fingerprint" onPress={onRetryBiometric} />

        <TextField
          label="PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
        />

        {error ? (
          <Typography variant="caption" color="danger">
            {error}
          </Typography>
        ) : null}

        <Button
          label={submitting ? 'Unlocking…' : 'Unlock'}
          onPress={onSubmitPin}
          disabled={submitting || pin.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
