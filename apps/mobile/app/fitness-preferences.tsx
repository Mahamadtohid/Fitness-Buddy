import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Button,
  Card,
  ChoiceCard,
  KeyboardAwareScreen,
  SegmentedControl,
  spacing,
  TextField,
  Typography,
  useTheme,
} from '../src/design';
import { getProfile, saveProfile } from '../src/data/repositories/profileRepository';
import { latestTargets } from '../src/data/repositories/targetsRepository';
import { getSecureItem, setSecureItem } from '../src/platform/secureStorage';

type Goal = 'lose' | 'maintain' | 'gain';

const GOALS: { value: Goal; label: string; description: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'lose', label: 'Lose weight', description: 'A steady, sustainable pace', icon: 'trending-down-outline' },
  { value: 'maintain', label: 'Maintain', description: 'Keep your current rhythm', icon: 'remove-outline' },
  { value: 'gain', label: 'Build muscle', description: 'Add strength and size', icon: 'barbell-outline' },
];

const ACTIVITY: { value: number; label: string; description: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 1.2, label: 'Beginner', description: 'New to training', icon: 'walk-outline' },
  { value: 1.3, label: 'Intermediate', description: 'A few sessions each week', icon: 'bicycle-outline' },
  { value: 1.4, label: 'Advanced', description: 'Consistent and pushing limits', icon: 'flash-outline' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DURATIONS = [30, 45, 60, 90].map((value) => ({ value: String(value), label: `${value} min` }));
const DAYS_KEY = 'fitness.workoutDays';
const DURATION_KEY = 'fitness.workoutDuration';

export default function FitnessPreferencesScreen() {
  const { colors } = useTheme();
  const profile = getProfile();
  const targets = latestTargets();
  const [goal, setGoal] = useState<Goal>((profile?.goal as Goal) ?? 'maintain');
  const [activity, setActivity] = useState(profile?.lifestyleFactor ?? 1.3);
  const [rateInput, setRateInput] = useState(String(profile?.rateKgPerWeek ?? 0));
  const [selectedDays, setSelectedDays] = useState<string[]>(DAYS.slice(0, 5));
  const [duration, setDuration] = useState('60');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getSecureItem(DAYS_KEY), getSecureItem(DURATION_KEY)]).then(([days, savedDuration]) => {
      if (!mounted) return;
      if (days) {
        try {
          const parsed = JSON.parse(days);
          if (Array.isArray(parsed) && parsed.every((day) => typeof day === 'string')) setSelectedDays(parsed);
        } catch {
          // Keep the sensible weekday default when a stored preference cannot be read.
        }
      }
      if (savedDuration && DURATIONS.some((option) => option.value === savedDuration)) setDuration(savedDuration);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  if (!profile) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Typography variant="body">No profile yet.</Typography>
      </View>
    );
  }

  const onSave = async () => {
    const rateKgPerWeek = Number(rateInput);
    if (!Number.isFinite(rateKgPerWeek)) return;

    saveProfile({
      sex: profile.sex,
      birthDate: profile.birthDate,
      heightCm: profile.heightCm,
      lifestyleFactor: activity,
      goal,
      rateKgPerWeek,
      units: profile.units,
      timeZone: profile.timeZone,
    });
    await Promise.all([
      setSecureItem(DAYS_KEY, JSON.stringify(selectedDays)),
      setSecureItem(DURATION_KEY, duration),
    ]);
    setSaved(true);
  };

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={String(colors.textPrimary)} />
        </Pressable>
        <Typography variant="title">Fitness preferences</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <Typography variant="body" color="secondary">Tune your plan around how you want to train.</Typography>

      <Card style={styles.card}>
        <Typography variant="title">Fitness goal</Typography>
        <View style={styles.choices}>
          {GOALS.map((option) => (
            <ChoiceCard
              key={option.value}
              label={option.label}
              description={option.description}
              icon={option.icon}
              selected={goal === option.value}
              onPress={() => { setGoal(option.value); setSaved(false); }}
            />
          ))}
        </View>
        <TextField
          label={profile.units === 'imperial' ? 'Weekly rate (lb/week)' : 'Weekly rate (kg/week)'}
          value={rateInput}
          onChangeText={(value) => { setRateInput(value); setSaved(false); }}
          keyboardType="numbers-and-punctuation"
        />
      </Card>

      <Card style={styles.card}>
        <Typography variant="title">Activity level</Typography>
        <View style={styles.choices}>
          {ACTIVITY.map((option) => (
            <ChoiceCard
              key={option.label}
              label={option.label}
              description={option.description}
              icon={option.icon}
              selected={activity === option.value}
              onPress={() => { setActivity(option.value); setSaved(false); }}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View>
            <Typography variant="title">Workout days</Typography>
            <Typography variant="caption" color="secondary">Choose the days you want to keep open.</Typography>
          </View>
          <Typography variant="caption" color="accent">{selectedDays.length}/7</Typography>
        </View>
        <View style={styles.dayRow}>
          {DAYS.map((day) => {
            const selected = selectedDays.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => {
                  setSelectedDays((current) => selected ? current.filter((item) => item !== day) : [...current, day]);
                  setSaved(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.day, { backgroundColor: selected ? colors.accentFill : colors.surfaceAlt, borderColor: selected ? colors.accentFill : colors.border }]}
              >
                <Typography variant="caption" style={{ color: selected ? colors.accentOn : colors.textSecondary }}>{day}</Typography>
              </Pressable>
            );
          })}
        </View>
        <Typography variant="caption" color="secondary">Workout duration</Typography>
        <SegmentedControl options={DURATIONS} value={duration} onChange={(value) => { setDuration(value); setSaved(false); }} />
      </Card>

      {targets ? (
        <Card style={styles.targetCard}>
          <Typography variant="title">Your current targets</Typography>
          <View style={styles.targetRow}>
            <View><Typography variant="statLarge">{Math.round(targets.kcalRest)}</Typography><Typography variant="caption" color="secondary">kcal rest day</Typography></View>
            <View><Typography variant="statLarge">{Math.round(targets.proteinG)} g</Typography><Typography variant="caption" color="secondary">protein</Typography></View>
            <View><Typography variant="statLarge">{Math.round(targets.waterMl / 100) / 10} L</Typography><Typography variant="caption" color="secondary">water</Typography></View>
          </View>
        </Card>
      ) : null}

      <Button label="Save changes" onPress={() => { void onSave(); }} />
      {saved ? <Typography variant="body" color="accent" style={styles.saved}>Preferences saved.</Typography> : null}
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  headerSpacer: { width: 24 },
  card: { gap: spacing.md },
  choices: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  day: { flex: 1, minHeight: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  targetCard: { gap: spacing.md },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  saved: { textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
});
