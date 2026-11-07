import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';

import { Button, Card, spacing, TextField, Typography, useTheme } from '../../src/design';
import { getProfile, saveProfile } from '../../src/data/repositories/profileRepository';
import { createTargets, latestTargets } from '../../src/data/repositories/targetsRepository';
import { listWeightEntries } from '../../src/data/repositories/weightEntryRepository';
import { calculateAgeFromBirthDate, calculateRestDayTarget, calculateTrainingDayTarget } from '../../src/domain/bmr';
import { calculateMacroTargets } from '../../src/domain/macros';
import { formatLength, type Units } from '../../src/domain/units';
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
import { UnitsSection } from '../../src/features/profile/components/UnitsSection';
import { ThemeSection } from '../../src/features/profile/components/ThemeSection';
import { ActiveSessionsSection } from '../../src/features/account/components/ActiveSessionsSection';
import { WaterReminderSettingsSection } from '../../src/features/water/components/WaterReminderSettingsSection';
import { AppLockSettingsSection } from '../../src/features/security/components/AppLockSettingsSection';

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
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
  const [importing, setImporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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

  /** PRD §3.1/§7.9 — irreversible, so a double confirmation (the destructive `Alert` button is
   * itself the second step after tapping "Delete account" below) before actually calling it. */
  const onDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account and all data on the server, and wipes this app’s data on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            setDeleteError(null);
            setDeleting(true);
            deleteAccount()
              .catch((err: unknown) => {
                setDeleteError(err instanceof Error ? err.message : 'Could not delete your account — try again.');
              })
              .finally(() => setDeleting(false));
          },
        },
      ],
    );
  };

  const onExportJson = async () => {
    setExportMessage(null);
    setExporting(true);
    try {
      const json = exportToJson();
      const shared = await writeAndShareFile(
        `fitness-companion-export-${getLocalDateString()}.json`,
        JSON.stringify(json, null, 2),
      );
      setExportMessage(
        shared ? 'Exported and ready to save/send.' : 'Exported, but sharing isn’t available on this device.',
      );
    } catch (err) {
      setExportMessage(err instanceof Error ? err.message : 'Export failed — please try again.');
    } finally {
      setExporting(false);
    }
  };

  const onExportCsv = async () => {
    if (!csvTable) return;
    setExportMessage(null);
    setExporting(true);
    try {
      const csv = exportTableToCsv(csvTable);
      const shared = await writeAndShareFile(`${csvTable}-${getLocalDateString()}.csv`, csv);
      setExportMessage(
        shared ? 'Exported and ready to save/send.' : 'Exported, but sharing isn’t available on this device.',
      );
    } catch (err) {
      setExportMessage(err instanceof Error ? err.message : 'Export failed — please try again.');
    } finally {
      setExporting(false);
    }
  };

  const onImport = async () => {
    setImportMessage(null);
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (result.canceled || !result.assets?.[0]) return;

    setImporting(true);
    try {
      const json = await new File(result.assets[0].uri).json();
      importFromJson(json);
      setImportMessage('Import complete.');
    } catch {
      setImportMessage('That file could not be read as a valid export — import skipped.');
    } finally {
      setImporting(false);
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
          {profile.sex}, born {profile.birthDate}, {formatLength(profile.heightCm, profile.units as Units)}
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

      <UnitsSection onChanged={() => setProfile(getProfile())} />

      <ThemeSection />

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
        <TextField
          label={profile.units === 'imperial' ? 'Rate (lb/week)' : 'Rate (kg/week)'}
          value={rateInput}
          onChangeText={setRateInput}
          keyboardType="numbers-and-punctuation"
        />
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
        <Button label={exporting ? 'Exporting…' : 'Export all data (JSON)'} onPress={onExportJson} disabled={exporting} />
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
        <Button
          variant="secondary"
          label={exporting ? 'Exporting…' : `Export ${csvTable || '—'} (CSV)`}
          onPress={onExportCsv}
          disabled={!csvTable || exporting}
        />
        {exportMessage ? (
          <Typography variant="caption" color="secondary">
            {exportMessage}
          </Typography>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <Typography variant="title">Import data</Typography>
        <Typography variant="caption" color="secondary">
          Restores a previously exported JSON file. Rows that already exist locally are skipped.
        </Typography>
        <Button
          variant="secondary"
          label={importing ? 'Importing…' : 'Choose file to import'}
          onPress={onImport}
          disabled={importing}
        />
        {importMessage ? (
          <Typography variant="caption" color="secondary">
            {importMessage}
          </Typography>
        ) : null}
      </Card>

      <WaterReminderSettingsSection />

      <AppLockSettingsSection />

      <ActiveSessionsSection />

      <Button variant="secondary" label="Log out" onPress={onLogout} />

      <Card style={styles.card}>
        <Typography variant="title">Privacy</Typography>
        <Button variant="secondary" label="Privacy policy" onPress={() => router.push('/privacy-policy')} />
      </Card>

      <Card style={[styles.card, styles.dangerCard, { borderColor: colors.danger }]}>
        <Typography variant="title" color="danger">
          Delete account
        </Typography>
        <Typography variant="caption" color="secondary">
          Permanently deletes your account and all data on the server, and wipes this app&apos;s data on
          this device. This cannot be undone.
        </Typography>
        {deleteError ? (
          <Typography variant="caption" color="danger">
            {deleteError}
          </Typography>
        ) : null}
        <Button
          variant="secondary"
          label={deleting ? 'Deleting…' : 'Delete account'}
          onPress={onDeleteAccount}
          disabled={deleting}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  emptyPadding: { padding: spacing.lg },
  card: { gap: spacing.sm },
  dangerCard: { borderWidth: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
});
