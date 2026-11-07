import { StyleSheet } from 'react-native';

import { Card, SegmentedControl, spacing, Typography, useTheme, type ThemePreference } from '../../../design';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Theme choice for Settings (FitTrack guidelines §6.8 — System/Light/Dark, persisted across
 * restarts by `ThemeProvider`). Not wired into settings.tsx here; the caller places it. */
export function ThemeSection() {
  const { preference, setPreference } = useTheme();

  return (
    <Card style={styles.card}>
      <Typography variant="title">Theme</Typography>
      <SegmentedControl<ThemePreference> options={OPTIONS} value={preference} onChange={setPreference} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
});
