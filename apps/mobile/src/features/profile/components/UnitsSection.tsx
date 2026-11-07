import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Card, SegmentedControl, spacing, Typography } from '../../../design';
import { getProfile, saveProfile } from '../../../data/repositories/profileRepository';
import type { Units } from '../../../domain/units';

const OPTIONS: { value: Units; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
];

/** Body-metrics units toggle (kg/cm vs lb/in) — storage stays metric either way; this only
 * changes how height/weight/measurements are displayed and entered elsewhere in the app. Not
 * wired into any screen here — the caller places it (e.g. Settings). */
export function UnitsSection() {
  const [profile, setProfile] = useState(() => getProfile());

  if (!profile) return null;

  const onChange = (units: Units) => {
    saveProfile({
      sex: profile.sex,
      birthDate: profile.birthDate,
      heightCm: profile.heightCm,
      lifestyleFactor: profile.lifestyleFactor,
      goal: profile.goal,
      rateKgPerWeek: profile.rateKgPerWeek,
      units,
      timeZone: profile.timeZone,
    });
    setProfile(getProfile());
  };

  return (
    <Card style={styles.card}>
      <Typography variant="title">Units</Typography>
      <SegmentedControl<Units> options={OPTIONS} value={profile.units as Units} onChange={onChange} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
});
