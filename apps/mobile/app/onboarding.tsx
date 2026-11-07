import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Button,
  Card,
  ChoiceCard,
  DateField,
  KeyboardAwareScreen,
  SegmentedControl,
  spacing,
  StepDots,
  TextField,
  Typography,
  useTheme,
  type TextFieldHandle,
} from '../src/design';
import { calculateAgeFromBirthDate, calculateRestDayTarget, calculateTrainingDayTarget } from '../src/domain/bmr';
import { calculateMacroTargets } from '../src/domain/macros';
import { formatWeight, parseLengthInput, parseWeightInput, type Units } from '../src/domain/units';
import { logWeight } from '../src/data/repositories/weightEntryRepository';
import { saveProfile } from '../src/data/repositories/profileRepository';
import { createTargets } from '../src/data/repositories/targetsRepository';
import { waterTargetMl } from '../src/data/repositories/waterEntryRepository';
import { getLocalDateString } from '../src/platform/localDate';

type Sex = 'male' | 'female';
type Goal = 'lose' | 'maintain' | 'gain';

const STEP_COUNT = 4;

const UNITS_OPTIONS: { value: Units; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'Imperial' },
];

/** The mockup's three goals, mapped onto the goal values the rest of the app already uses. */
const GOAL_OPTIONS: {
  value: Goal;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { value: 'lose', label: 'Lose Weight', description: 'Shed fat at a steady pace', icon: 'flame-outline' },
  { value: 'gain', label: 'Build Muscle', description: 'Add size and strength', icon: 'barbell-outline' },
  { value: 'maintain', label: 'Keep Fit', description: 'Hold your current shape', icon: 'heart-outline' },
];

/**
 * The mockup asks for Beginner/Intermediate/Advanced, while the calorie maths needs an activity
 * multiplier. These map onto three of the multipliers the app already used, so the BMR formula is
 * unchanged — only how the value is phrased to the user.
 */
const LEVEL_OPTIONS: {
  value: number;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { value: 1.2, label: 'Beginner', description: 'New to training', icon: 'walk-outline' },
  { value: 1.3, label: 'Intermediate', description: 'Train a few times a week', icon: 'bicycle-outline' },
  { value: 1.4, label: 'Advanced', description: 'Consistent and pushing limits', icon: 'flash-outline' },
];

const GOAL_DEFAULT_RATE: Record<Goal, number> = { lose: -0.5, maintain: 0, gain: 0.25 };

/** Nobody signing up is under 13 or over 100; bounding the picker keeps the wheel usable. */
const OLDEST_BIRTH_DATE = new Date(new Date().getFullYear() - 100, 0, 1);
const YOUNGEST_BIRTH_DATE = new Date(new Date().getFullYear() - 13, 11, 31);

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);

  const [units, setUnits] = useState<Units>('metric');
  const [sex, setSex] = useState<Sex | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [lifestyleFactor, setLifestyleFactor] = useState<number | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [rateInput, setRateInput] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const weightRef = useRef<TextFieldHandle>(null);

  const onSelectGoal = (value: Goal) => {
    setGoal(value);
    setRateInput(String(GOAL_DEFAULT_RATE[value]));
  };

  const heightCm = parseLengthInput(heightInput, units);
  const weightKg = parseWeightInput(weightInput, units);
  const detailsComplete =
    sex !== null &&
    birthDate.length > 0 &&
    Number.isFinite(heightCm) &&
    heightCm > 0 &&
    Number.isFinite(weightKg) &&
    weightKg > 0;

  /** Only computable once step 3 is filled in; step 4 previews it before anything is written. */
  const preview =
    detailsComplete && goal !== null && lifestyleFactor !== null
      ? (() => {
          const bmrInput = {
            sex,
            weightKg,
            heightCm,
            ageYears: calculateAgeFromBirthDate(birthDate),
            lifestyleFactor,
            rateKgPerWeek: Number(rateInput) || 0,
          };
          const kcalRest = Math.round(calculateRestDayTarget(bmrInput));
          const kcalTraining = Math.round(calculateTrainingDayTarget(bmrInput));
          const macros = calculateMacroTargets(kcalRest, { weightKg, heightCm });
          return { kcalRest, kcalTraining, proteinG: Math.round(macros.proteinG), macros };
        })()
      : null;

  const canAdvance =
    step === 0 ? goal !== null : step === 1 ? lifestyleFactor !== null : step === 2 ? detailsComplete : preview !== null;

  const onNext = () => {
    setError(null);
    if (!canAdvance) {
      setError(
        step === 2 ? 'Fill in your details to continue.' : 'Pick an option to continue.',
      );
      return;
    }
    if (step < STEP_COUNT - 1) {
      setStep((s) => s + 1);
      return;
    }
    onFinish();
  };

  const onFinish = () => {
    if (!preview || !sex || goal === null || lifestyleFactor === null) return;

    try {
      const today = getLocalDateString();
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      logWeight(today, weightKg);

      saveProfile({
        sex,
        birthDate,
        heightCm,
        lifestyleFactor,
        goal,
        rateKgPerWeek: Number(rateInput) || 0,
        units,
        timeZone,
      });

      createTargets(
        {
          effectiveFrom: today,
          kcalRest: preview.kcalRest,
          kcalTraining: preview.kcalTraining,
          proteinG: preview.proteinG,
          fatG: Math.round(preview.macros.fatG),
          carbG: Math.round(preview.macros.carbG),
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
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {step > 0 ? (
          <Pressable
            onPress={() => {
              setError(null);
              setStep((s) => s - 1);
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back a step"
            hitSlop={8}
            style={[styles.back, { backgroundColor: colors.surfaceAlt }]}
          >
            <Ionicons name="chevron-back" size={20} color={String(colors.textPrimary)} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <StepDots count={STEP_COUNT} current={step} />
        <View style={styles.back} />
      </View>

      {step === 0 ? (
        <>
          <Typography variant="headline">What is your main goal?</Typography>
          <View style={styles.choices}>
            {GOAL_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                label={option.label}
                description={option.description}
                icon={option.icon}
                selected={goal === option.value}
                onPress={() => onSelectGoal(option.value)}
              />
            ))}
          </View>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Typography variant="headline">What is your fitness level?</Typography>
          <View style={styles.choices}>
            {LEVEL_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                label={option.label}
                description={option.description}
                icon={option.icon}
                selected={lifestyleFactor === option.value}
                onPress={() => setLifestyleFactor(option.value)}
              />
            ))}
          </View>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Typography variant="headline">A few details about you</Typography>
          <Typography variant="body" color="secondary">
            Used once to calculate your starting targets.
          </Typography>

          <Card style={styles.card}>
            <Typography variant="caption" color="secondary">
              Units
            </Typography>
            <SegmentedControl<Units> options={UNITS_OPTIONS} value={units} onChange={setUnits} />
          </Card>

          <View style={styles.choices}>
            <ChoiceCard
              label="Male"
              icon="man-outline"
              selected={sex === 'male'}
              onPress={() => setSex('male')}
            />
            <ChoiceCard
              label="Female"
              icon="woman-outline"
              selected={sex === 'female'}
              onPress={() => setSex('female')}
            />
          </View>

          <DateField
            label="Date of birth"
            value={birthDate}
            onChange={setBirthDate}
            minimumDate={OLDEST_BIRTH_DATE}
            maximumDate={YOUNGEST_BIRTH_DATE}
          />

          <TextField
            label={units === 'imperial' ? 'Height (in)' : 'Height (cm)'}
            value={heightInput}
            onChangeText={setHeightInput}
            keyboardType="decimal-pad"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => weightRef.current?.focus()}
          />
          <TextField
            ref={weightRef}
            label={units === 'imperial' ? 'Current weight (lb)' : 'Current weight (kg)'}
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Typography variant="headline">Your starting targets</Typography>
          {preview ? (
            <Card style={styles.card}>
              <View style={styles.previewRow}>
                <Typography variant="body" color="secondary">
                  Calories (rest day)
                </Typography>
                <Typography variant="bodyStrong">{preview.kcalRest} kcal</Typography>
              </View>
              <View style={styles.previewRow}>
                <Typography variant="body" color="secondary">
                  Calories (training day)
                </Typography>
                <Typography variant="bodyStrong">{preview.kcalTraining} kcal</Typography>
              </View>
              <View style={styles.previewRow}>
                <Typography variant="body" color="secondary">
                  Protein
                </Typography>
                <Typography variant="bodyStrong">{preview.proteinG} g</Typography>
              </View>
              <View style={styles.previewRow}>
                <Typography variant="body" color="secondary">
                  Starting weight
                </Typography>
                <Typography variant="bodyStrong">{formatWeight(weightKg, units)}</Typography>
              </View>
            </Card>
          ) : null}

          <TextField
            label={units === 'imperial' ? 'Weekly rate (lb/week)' : 'Weekly rate (kg/week)'}
            value={rateInput}
            onChangeText={setRateInput}
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
          />

          <Typography variant="caption" color="secondary">
            These are estimates, not medical advice — you can adjust any of them later in Settings.
            Loss is capped around 1% of body weight per week and gain around 0.5%.
          </Typography>
        </>
      ) : null}

      {error ? (
        <Typography variant="body" color="danger">
          {error}
        </Typography>
      ) : null}

      <View style={styles.spacer} />

      <Button label={step === STEP_COUNT - 1 ? 'Finish' : 'Next'} onPress={onNext} disabled={!canAdvance} />
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choices: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: spacing.md,
  },
});
