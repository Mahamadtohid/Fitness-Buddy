import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, Card, spacing, Typography } from '../../../design';
import { client, SessionDto } from '../../../data/api/client';
import { useAuthStore } from '../useAuthStore';

/** Settings section (PRD §3.8 account / session management): lists this user's active login
 * sessions (one row per device/login) and lets them sign out of all devices at once. Mirrors
 * the delete-account section's destructive two-step confirm and async loading/error
 * conventions (see app/(tabs)/settings.tsx). */
export function ActiveSessionsSection() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const signOutAllDevices = useAuthStore((s) => s.signOutAllDevices);

  const [sessions, setSessions] = useState<SessionDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    client
      .listSessions(accessToken)
      .then((result) => {
        if (!cancelled) {
          setSessions(result);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Could not load your sessions — try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const onSignOutAllDevices = () => {
    Alert.alert(
      'Sign out of all devices?',
      'This signs you out everywhere, including this device. You will need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out of all devices',
          style: 'destructive',
          onPress: () => {
            setSignOutError(null);
            setSigningOut(true);
            signOutAllDevices()
              .catch((err: unknown) => {
                setSignOutError(err instanceof Error ? err.message : 'Could not sign out of all devices — try again.');
              })
              .finally(() => setSigningOut(false));
          },
        },
      ],
    );
  };

  return (
    <Card style={{ gap: spacing.sm }}>
      <Typography variant="title">Active sessions</Typography>

      {loading ? (
        <Typography variant="body" color="secondary">
          Loading sessions…
        </Typography>
      ) : loadError ? (
        <Typography variant="caption" color="danger">
          {loadError}
        </Typography>
      ) : sessions && sessions.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {sessions.map((session) => (
            <View key={session.familyId} style={{ gap: 2 }}>
              <Typography variant="body">{session.deviceName ?? 'Unknown device'}</Typography>
              <Typography variant="caption" color="secondary">
                Signed in {new Date(session.createdAt).toLocaleString()}
              </Typography>
            </View>
          ))}
        </View>
      ) : (
        <Typography variant="body" color="secondary">
          No active sessions.
        </Typography>
      )}

      {signOutError ? (
        <Typography variant="caption" color="danger">
          {signOutError}
        </Typography>
      ) : null}

      <Button
        variant="secondary"
        label={signingOut ? 'Signing out…' : 'Sign out of all devices'}
        onPress={onSignOutAllDevices}
        disabled={signingOut}
      />
    </Card>
  );
}
