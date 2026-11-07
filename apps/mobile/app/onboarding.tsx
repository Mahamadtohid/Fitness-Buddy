import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, spacing, TextField, Typography, useTheme } from '../src/design';
import { calculateAgeFromBirthDate, calculateRestDayTarget, calculateTrainingDayTarget } from '../src/domain/bmr';
import { calculateMacroTargets } from '../src/domain/macros';
import { logWeight } from '../src/data/repositories/weightEntryRepository';
import { saveProfile } from '../src/data/repositories/profileRepository';
import { createTargets } from '../src/data/repositories/targetsRepository';
import { waterTargetMl } from '../src/data/repositories/waterEntryRepository';
import { getLocalDateString } from '../src/platform/localDate';

type Sex = 'male' | 'female';
type Goal = 'lose' | 'maintain' | 'gain';

const LIFESTYLE_OPTIONS: { value: number; label: string }[] = [
  { value: 1.2, label: 'Desk job, little walking' },
  { value: 1.3, label: 'Some walking' },
  { value: 1.4, label: 'On my feet a lot' },
];

const GOAL_DEFAULT_RATE: Record<Goal, number> = { lose: -0.5, maintain: 0, gain: 0.25 };

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [sex, setSex] = useState<Sex | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [lifestyleFactor, setLifestyleFactor] = useState<number | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [rateInput, setRateInput] = useState('0');
  const [error, setError] = useState<string | null>(null);

  const onSelectGoal = (value: Goal) => {
    setGoal(value);
    setRateInput(String(GOAL_DEFAULT_RATE[value]));
  };

  const onSubmit = () => {
    const heightCm = Number(heightInput);
    const weightKg = Number(weightInput);
    const rateKgPerWeek = Number(rateInput);

    if (
      !sex ||
      !birthDate.trim() ||
      !Number.isFinite(heightCm) ||
      heightCm <= 0 ||
      !Number.isFinite(weightKg) ||
      weightKg <= 0 ||
      lifestyleFactor === null ||
      !goal ||
      !Number.isFinite(rateKgPerWeek)
    ) {
      setError('Please fill in every field above.');
      return;
    }

    try {
      const today = getLocalDateString();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const ageYears = calculateAgeFromBirthDate(birthDate.trim());

      logWeight(today, weightKg);

      saveProfile({
        sex,
        birthDate: birthDate.trim(),
        heightCm,
        lifestyleFactor,
        goal,
        rateKgPerWeek,
        units: 'metric',
        timeZone,
      });

      const bmrInput = { sex, weightKg, heightCm, ageYears, lifestyleFactor, rateKgPerWeek };
      const kcalRest = Math.round(calculateRestDayTarget(bmrInput));
      const kcalTraining = Math.round(calculateTrainingDayTarget(bmrInput));
      const { proteinG, fatG, carbG } = calculateMacroTargets(kcalRest, { weightKg, heightCm });

      createTargets(
        {
          effectiveFrom: today,
          kcalRest,
          kcalTraining,
          proteinG: Math.round(proteinG),
          fatG: Math.round(fatG),
          carbG: Math.round(carbG),
          waterMl: Math.round(waterTargetMl()),
        },
        'auto',
      );

      router.replace('/(tabs)');
    } catch (err) {
      // None of the calls above touch the network, but a local-DB failure here would otherwise
      // be a silent dead end on the one screen a brand-new account can't get past — surface it.
      setError(err instanceof Error ? err.message : 'Something went wrong saving your profile — please try again.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="headline">Let&apos;s set up your targets</Typography>
      <Typography variant="body" color="secondary">
        Used once to calculate your starting calorie and protein targets (PRD §3.2) — you can
        override any of it later in Settings.
      </Typography>

      <Card style={styles.card}>
        <Typography variant="title">Sex</Typography>
        <View style={styles.row}>
          <Button label="Male" variant={sex === 'male' ? 'primary' : 'secondary'} onPress={() => setSex('male')} />
          <Button label="Female" variant={sex === 'female' ? 'primary' : 'secondary'} onPress={() => setSex('female')} />
        </View>
      </Card>

      <Card style={styles.card}>
        <TextField label="Birth date (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} keyboardType="numbers-and-punctuation" />
        <TextField label="Height (cm)" value={heightInput} onChangeText={setHeightInput} keyboardType="decimal-pad" />
        <TextField label="Current weight (kg)" value={weightInput} onChangeText={setWeightInput} keyboardType="decimal-pad" />
      </Card>

      <Card style={styles.card}>
        <Typography variant="title">Daily activity</Typography>
        {LIFESTYLE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            label={option.label}
            variant={lifestyleFactor === option.value ? 'primary' : 'secondary'}
            onPress={() => setLifestyleFactor(option.value)}
          />
        ))}
      </Card>

      <Card style={styles.card}>
        <Typography variant="title">Goal</Typography>
        <View style={styles.row}>
          <Button label="Lose" variant={goal === 'lose' ? 'primary' : 'secondary'} onPress={() => onSelectGoal('lose')} />
          <Button label="Maintain" variant={goal === 'maintain' ? 'primary' : 'secondary'} onPress={() => onSelectGoal('maintain')} />
          <Button label="Gain" variant={goal === 'gain' ? 'primary' : 'secondary'} onPress={() => onSelectGoal('gain')} />
        </View>
        <TextField label="Rate (kg/week, negative to lose)" value={rateInput} onChangeText={setRateInput} keyboardType="numbers-and-punctuation" />
        <Typography variant="caption" color="secondary">
          Guardrail: loss capped around 1% of body weight/week, gain around 0.5% (PRD §4.1) — the
          default above is a safe starting point.
        </Typography>
      </Card>

      {error ? (
        <Typography variant="body" color="danger">
          {error}
        </Typography>
      ) : null}

      <Button label="Save and continue" onPress={onSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
