import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { Button, Card, spacing, TextField, Typography, useTheme } from '../../src/design';
import { getProfile, saveProfile } from '../../src/data/repositories/profileRepository';
import { createTargets, latestTargets } from '../../src/data/repositories/targetsRepository';
import { listWeightEntries } from '../../src/data/repositories/weightEntryRepository';
import { calculateAgeFromBirthDate, calculateRestDayTarget, calculateTrainingDayTarget } from '../../src/domain/bmr';
import { calculateMacroTargets } from '../../src/domain/macros';
import { useAuthStore } from '../../src/features/account/useAuthStore';
import type { ProfileRow, TargetRow } from '../../src/data/db/schema';
import { getLocalDateString } from '../../src/platform/localDate';
import {
  availableExportTableNames,
  exportTableToCsv,
  exportToJson,
  PHOTO_EXPORT_NOTE,
} from '../../src/data/export/exportData';
import { writeAndShareFile } from '../../src/data/export/fileSharing';
import { importFromJson } from '../../src/data/export/importData';

type Goal = 'lose' | 'maintain' | 'gain';

const GOALS: { goal: Goal; label: string }[] = [
  { goal: 'lose', label: 'Lose' },
  { goal: 'maintain', label: 'Maintain' },
  { goal: 'gain', label: 'Gain' },
];

/**
 * Settings (PRD §3.2 target override, §3.8 account) — profile summary, goal/rate editing with
 * recalculation, a manual target override form, and Logout (closes a gap left since Phase 2: the
 * `logout()` action existed but nothing in the UI could call it until now).
 */
export default function SettingsScreen() {
  const { colors } = useTheme();
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState<ProfileRow | null>(() => getProfile());
  const [targets, setTargets] = useState<TargetRow | null>(() => latestTargets());
  const [goal, setGoal] = useState<Goal>((profile?.goal as Goal) ?? 'maintain');
  const [rateInput, setRateInput] = useState(String(profile?.rateKgPerWeek ?? 0));

  const [overrideKcal, setOverrideKcal] = useState('');
  const [overrideProtein, setOverrideProtein] = useState('');
  const [overrideFat, setOverrideFat] = useState('');
  const [overrideCarb, setOverrideCarb] = useState('');
  const [overrideWater, setOverrideWater] = useState('');
  const [csvTable, setCsvTable] = useState(availableExportTableNames()[0] ?? '');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const onRecalculate = () => {
    if (!profile) return;
    const rateKgPerWeek = Number(rateInput);
    if (!Number.isFinite(rateKgPerWeek)) return;

    const latestWeight = listWeightEntries()[0]?.weightKg;
    if (!latestWeight) return;

    saveProfile({
      sex: profile.sex as 'male' | 'female',
      birthDate: profile.birthDate,
      heightCm: profile.heightCm,
      lifestyleFactor: profile.lifestyleFactor,
      goal,
      rateKgPerWeek,
      units: profile.units,
      timeZone: profile.timeZone,
    });

    const ageYears = calculateAgeFromBirthDate(profile.birthDate);
    const bmrInput = {
      sex: profile.sex as 'male' | 'female',
      weightKg: latestWeight,
      heightCm: profile.heightCm,
      ageYears,
      lifestyleFactor: profile.lifestyleFactor,
      rateKgPerWeek,
    };
    const kcalRest = Math.round(calculateRestDayTarget(bmrInput));
    const kcalTraining = Math.round(calculateTrainingDayTarget(bmrInput));
    const { proteinG, fatG, carbG } = calculateMacroTargets(kcalRest, {
      weightKg: latestWeight,
      heightCm: profile.heightCm,
    });

    createTargets(
      {
        effectiveFrom: getLocalDateString(),
        kcalRest,
        kcalTraining,
        proteinG: Math.round(proteinG),
        fatG: Math.round(fatG),
        carbG: Math.round(carbG),
        waterMl: targets?.waterMl ?? 0,
      },
      'auto',
    );

    setProfile(getProfile());
    setTargets(latestTargets());
  };

  const onManualOverride = () => {
    const kcalRest = Number(overrideKcal);
    const proteinG = Number(overrideProtein);
    const fatG = Number(overrideFat);
    const carbG = Number(overrideCarb);
    const waterMl = Number(overrideWater);
    if (![kcalRest, proteinG, fatG, carbG, waterMl].every(Number.isFinite)) return;

    createTargets(
      {
        effectiveFrom: getLocalDateString(),
        kcalRest,
        kcalTraining: kcalRest + 300,
        proteinG,
        fatG,
        carbG,
        waterMl,
      },
      'manual',
    );
    setTargets(latestTargets());
  };

  const onLogout = () => {
    void logout();
    // No explicit navigation needed: app/_layout.tsx's auth-status watcher already redirects to
    // (auth)/welcome as soon as `status` flips to 'unauthenticated'.
  };

  const onExportJson = async () => {
    const json = exportToJson();
    await writeAndShareFile(`fitness-companion-export-${getLocalDateString()}.json`, JSON.stringify(json, null, 2));
  };

  const onExportCsv = async () => {
    if (!csvTable) return;
    const csv = exportTableToCsv(csvTable);
    await writeAndShareFile(`${csvTable}-${getLocalDateString()}.csv`, csv);
  };

  const onImport = async () => {
    setImportMessage(null);
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (result.canceled || !result.assets?.[0]) return;

    try {
      const json = await new File(result.assets[0].uri).json();
      importFromJson(json);
      setImportMessage('Import complete.');
    } catch {
      setImportMessage('That file could not be read as a valid export — import skipped.');
    }
  };

  if (!profile) {
    return (
      <View style={[styles.container, styles.emptyPadding, { backgroundColor: colors.background }]}>
        <Typography variant="body">No profile yet.</Typography>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Typography variant="headline">Settings</Typography>

      <Card style={styles.card}>
        <Typography variant="title">Profile</Typography>
        <Typography variant="body">
          {profile.sex}, born {profile.birthDate}, {profile.heightCm} cm
        </Typography>
        {targets ? (
          <Typography variant="body" color="secondary">
            Current target: {targets.kcalRest} kcal rest / {targets.kcalTraining} kcal training ·{' '}
            {targets.proteinG} g protein
          </Typography>
        ) : (
          <Typography variant="body" color="secondary">
            No targets calculated yet.
          </Typography>
        )}
      </Card>

      <Card style={styles.card}>
        <Typography variant="title">Goal</Typography>
        <View style={styles.row}>
          {GOALS.map((g) => (
            <Button
              key={g.goal}
              label={g.label}
              variant={goal === g.goal ? 'primary' : 'secondary'}
              onPress={() => setGoal(g.goal)}
            />
          ))}
        </View>
        <TextField label="Rate (kg/week)" value={rateInput} onChangeText={setRateInput} keyboardType="numbers-and-punctuation" />
        <Button label="Recalculate targets" onPress={onRecalculate} />
      </Card>

      <Card style={styles.card}>
        <Typography variant="title">Manual target override</Typography>
        <TextField label="Calories (rest day)" value={overrideKcal} onChangeText={setOverrideKcal} keyboardType="number-pad" />
        <TextField label="Protein (g)" value={overrideProtein} onChangeText={setOverrideProtein} keyboardType="number-pad" />
        <TextField label="Fat (g)" value={overrideFat} onChangeText={setOverrideFat} keyboardType="number-pad" />
        <TextField label="Carbs (g)" value={overrideCarb} onChangeText={setOverrideCarb} keyboardType="number-pad" />
        <TextField label="Water (ml)" value={overrideWater} onChangeText={setOverrideWater} keyboardType="number-pad" />
        <Button label="Save override" onPress={onManualOverride} />
      </Card>

      <Card style={styles.card}>
        <Typography variant="title">Export data</Typography>
        <Typography variant="caption" color="secondary">
          {PHOTO_EXPORT_NOTE}
        </Typography>
        <Button label="Export all data (JSON)" onPress={onExportJson} />
        <View style={styles.row}>
          {availableExportTableNames().map((name) => (
            <Button
              key={name}
              label={name}
              variant={csvTable === name ? 'primary' : 'secondary'}
              onPress={() => setCsvTable(name)}
            />
          ))}
        </View>
        <Button variant="secondary" label={`Export ${csvTable || '—'} (CSV)`} onPress={onExportCsv} disabled={!csvTable} />
      </Card>

      <Card style={styles.card}>
        <Typography variant="title">Import data</Typography>
        <Typography variant="caption" color="secondary">
          Restores a previously exported JSON file. Rows that already exist locally are skipped.
        </Typography>
        <Button variant="secondary" label="Choose file to import" onPress={onImport} />
        {importMessage ? (
          <Typography variant="caption" color="secondary">
            {importMessage}
          </Typography>
        ) : null}
      </Card>

      <Button variant="secondary" label="Log out" onPress={onLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  emptyPadding: { padding: spacing.lg },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
});
