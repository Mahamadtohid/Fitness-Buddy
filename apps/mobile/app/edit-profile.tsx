import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Card,
  DateField,
  KeyboardAwareScreen,
  SegmentedControl,
  spacing,
  TextField,
  Typography,
  useTheme,
} from '../src/design';
import { getProfile, saveProfile } from '../src/data/repositories/profileRepository';
import { listWeightEntries, logWeight } from '../src/data/repositories/weightEntryRepository';
import { kgToLb, parseLengthInput, parseWeightInput, type Units } from '../src/domain/units';
import { getLocalDateString } from '../src/platform/localDate';
import { useAuthStore } from '../src/features/account/useAuthStore';

type Sex = 'male' | 'female';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

function displayWeight(weightKg: number | undefined, units: Units): string {
  if (weightKg === undefined) return '';
  return units === 'imperial' ? kgToLb(weightKg).toFixed(1) : weightKg.toFixed(1);
}

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const email = useAuthStore((state) => state.userEmail);
  const initialProfile = getProfile();
  const [profile, setProfile] = useState(initialProfile);
  const [birthDate, setBirthDate] = useState(initialProfile?.birthDate ?? '');
  const [sex, setSex] = useState<Sex>((initialProfile?.sex as Sex) ?? 'male');
  const [heightInput, setHeightInput] = useState(
    initialProfile ? (initialProfile.units === 'imperial' ? (initialProfile.heightCm / 2.54).toFixed(1) : String(Math.round(initialProfile.heightCm))) : '',
  );
  const [weightInput, setWeightInput] = useState(
    displayWeight(listWeightEntries()[0]?.weightKg, (initialProfile?.units as Units) ?? 'metric'),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!profile) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Typography variant="body">No profile yet.</Typography>
      </View>
    );
  }

  const units = profile.units as Units;

  const onSave = () => {
    const heightCm = parseLengthInput(heightInput, units);
    const weightKg = parseWeightInput(weightInput, units);

    if (!Number.isFinite(heightCm) || heightCm < 80 || heightCm > 250) {
      setError(`Enter a height between 80 and 250 ${units === 'imperial' ? 'inches' : 'cm'}.`);
      return;
    }
    if (!Number.isFinite(weightKg) || weightKg < 25 || weightKg > 500) {
      setError(`Enter a valid weight in ${units === 'imperial' ? 'lb' : 'kg'}.`);
      return;
    }

    saveProfile({
      sex,
      birthDate,
      heightCm,
      lifestyleFactor: profile.lifestyleFactor,
      goal: profile.goal,
      rateKgPerWeek: profile.rateKgPerWeek,
      units: profile.units,
      timeZone: profile.timeZone,
    });
    logWeight(getLocalDateString(), weightKg);
    setProfile(getProfile());
    setError(null);
    setSaved(true);
  };

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={String(colors.textPrimary)} />
        </Pressable>
        <Typography variant="title">Edit profile</Typography>
        <Pressable onPress={onSave} accessibilityRole="button" hitSlop={8}>
          <Typography variant="bodyStrong" color="accent">Save</Typography>
        </Pressable>
      </View>

      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt, borderColor: colors.accent }]}>
          <Ionicons name="person" size={40} color={String(colors.accent)} />
        </View>
        <Typography variant="title">Your profile</Typography>
        <Typography variant="caption" color="secondary">Keep your details current for better targets.</Typography>
      </View>

      <Card style={styles.card}>
        <Typography variant="caption" color="secondary">Account email</Typography>
        <TextField label="Email" value={email ?? 'Not available'} editable={false} />
      </Card>

      <Card style={styles.card}>
        <Typography variant="caption" color="secondary">Personal information</Typography>
        <DateField label="Date of birth" value={birthDate} onChange={setBirthDate} />
        <View style={styles.fieldGap} />
        <Typography variant="caption" color="secondary">Gender</Typography>
        <SegmentedControl<Sex> options={SEX_OPTIONS} value={sex} onChange={setSex} />
        <TextField
          label={units === 'imperial' ? 'Height (in)' : 'Height (cm)'}
          value={heightInput}
          onChangeText={(value) => { setHeightInput(value); setSaved(false); }}
          keyboardType="decimal-pad"
        />
        <TextField
          label={units === 'imperial' ? 'Current weight (lb)' : 'Current weight (kg)'}
          value={weightInput}
          onChangeText={(value) => { setWeightInput(value); setSaved(false); }}
          keyboardType="decimal-pad"
        />
      </Card>

      {error ? <Typography variant="body" color="danger">{error}</Typography> : null}
      {saved ? <Typography variant="body" color="accent">Profile saved. Your targets will use the latest weight.</Typography> : null}
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  identity: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  card: { gap: spacing.md },
  fieldGap: { height: spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
});
