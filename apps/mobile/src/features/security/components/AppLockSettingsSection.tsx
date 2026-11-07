import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, spacing, TextField, Typography } from '../../../design';
import { useAppLockStore } from '../useAppLockStore';

const MIN_PIN_LENGTH = 4;

/**
 * Settings screen section (PRD app-lock feature) for turning app lock on/off. Not wired into
 * settings.tsx by this change — imported and placed there separately.
 */
export function AppLockSettingsSection() {
  const enabled = useAppLockStore((s) => s.enabled);
  const setPin = useAppLockStore((s) => s.setPin);
  const disable = useAppLockStore((s) => s.disable);
  const unlockWithPin = useAppLockStore((s) => s.unlockWithPin);
  const unlockWithBiometric = useAppLockStore((s) => s.unlockWithBiometric);

  const [settingUp, setSettingUp] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [savingSetup, setSavingSetup] = useState(false);

  const [reauthRequired, setReauthRequired] = useState(false);
  const [reauthPin, setReauthPin] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);

  const onStartSetup = () => {
    setSettingUp(true);
    setSetupError(null);
    setNewPin('');
    setConfirmPin('');
  };

  const onCancelSetup = () => {
    setSettingUp(false);
    setSetupError(null);
    setNewPin('');
    setConfirmPin('');
  };

  const onSaveSetup = async () => {
    if (newPin.length < MIN_PIN_LENGTH) {
      setSetupError(`PIN must be at least ${MIN_PIN_LENGTH} digits.`);
      return;
    }
    if (newPin !== confirmPin) {
      setSetupError('PINs do not match.');
      return;
    }

    setSetupError(null);
    setSavingSetup(true);
    try {
      await setPin(newPin);
      setSettingUp(false);
      setNewPin('');
      setConfirmPin('');
    } catch {
      setSetupError('Could not set up app lock — try again.');
    } finally {
      setSavingSetup(false);
    }
  };

  const onPressTurnOff = async () => {
    setReauthError(null);
    // Try biometric re-auth first; only fall back to an inline PIN prompt if it's unavailable or
    // fails/is cancelled. Either way, disable() only runs after re-authentication succeeds.
    const biometricOk = await unlockWithBiometric();
    if (biometricOk) {
      confirmAndDisable();
      return;
    }
    setReauthRequired(true);
    setReauthPin('');
  };

  const confirmAndDisable = () => {
    Alert.alert('Turn off app lock?', 'Your progress photos and data will no longer require unlocking.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Turn off',
        style: 'destructive',
        onPress: () => {
          setDisabling(true);
          disable().finally(() => setDisabling(false));
        },
      },
    ]);
  };

  const onCancelReauth = () => {
    setReauthRequired(false);
    setReauthPin('');
    setReauthError(null);
  };

  const onSubmitReauth = async () => {
    setReauthError(null);
    const ok = await unlockWithPin(reauthPin);
    if (!ok) {
      setReauthError('Incorrect PIN.');
      setReauthPin('');
      return;
    }
    setReauthRequired(false);
    setReauthPin('');
    confirmAndDisable();
  };

  if (!enabled) {
    return (
      <Card style={styles.card}>
        <Typography variant="title">App lock</Typography>
        <Typography variant="caption" color="secondary">
          Require a PIN or biometric unlock to open the app — recommended to protect your progress
          photos.
        </Typography>

        {settingUp ? (
          <View style={styles.card}>
            <TextField
              label="New PIN"
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
            />
            <TextField
              label="Confirm PIN"
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
            />
            {setupError ? (
              <Typography variant="caption" color="danger">
                {setupError}
              </Typography>
            ) : null}
            <View style={styles.row}>
              <Button variant="secondary" label="Cancel" onPress={onCancelSetup} disabled={savingSetup} />
              <Button label="Save PIN" onPress={onSaveSetup} loading={savingSetup} />
            </View>
          </View>
        ) : (
          <Button label="Set up app lock" onPress={onStartSetup} />
        )}
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Typography variant="title">App lock</Typography>
      <Typography variant="body" color="secondary">
        App lock is on.
      </Typography>

      {reauthRequired ? (
        <View style={styles.card}>
          <Typography variant="caption" color="secondary">
            Enter your PIN to confirm it&apos;s you before turning off app lock.
          </Typography>
          <TextField
            label="PIN"
            value={reauthPin}
            onChangeText={setReauthPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
          />
          {reauthError ? (
            <Typography variant="caption" color="danger">
              {reauthError}
            </Typography>
          ) : null}
          <View style={styles.row}>
            <Button variant="secondary" label="Cancel" onPress={onCancelReauth} />
            <Button label="Confirm" onPress={onSubmitReauth} disabled={reauthPin.length === 0} />
          </View>
        </View>
      ) : (
        <Button
          variant="secondary"
          label="Turn off app lock"
          onPress={onPressTurnOff}
          loading={disabling}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
});
