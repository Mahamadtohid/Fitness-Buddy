import { memo, useCallback, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { FlatList, Image, StyleSheet, View } from 'react-native';

import { Button, Card, radius, spacing, TextField, Typography, useTheme } from '../../src/design';
import { listWeightEntries, logWeight } from '../../src/data/repositories/weightEntryRepository';
import { retryNow, useSyncStatusStore } from '../../src/data/sync';
import type { CheckInRow, MeasurementRow, PhotoRow, WeightEntryRow } from '../../src/data/db/schema';
import { getLocalDateString } from '../../src/platform/localDate';
import { calculateTrendSeries, weeklyRateFromSeries } from '../../src/domain/trend';
import { currentWeekCheckIn, generateCheckIn, recordDecision } from '../../src/data/repositories/checkInRepository';
import { logMeasurement, listByType } from '../../src/data/repositories/measurementRepository';
import type { MeasurementType } from '../../src/data/repositories/measurementLogic';
import { savePhoto, listPhotos, type Pose } from '../../src/data/repositories/photoRepository';

const TREND_WINDOW_DAYS = 30;

const TrendBars = memo(function TrendBars({ series }: { series: { localDate: string; trend: number }[] }) {
  const { colors } = useTheme();
  const window = series.slice(-TREND_WINDOW_DAYS);
  if (window.length === 0) {
    return (
      <Typography variant="caption" color="secondary">
        Log a few weigh-ins to see your trend.
      </Typography>
    );
  }

  const values = window.map((w) => w.trend);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <View style={styles.trendRow}>
      {window.map((point) => {
        const heightPct = 0.15 + 0.85 * ((point.trend - min) / range);
        return (
          <View key={point.localDate} style={styles.trendBarTrack}>
            <View
              style={[styles.trendBarFill, { height: `${heightPct * 100}%`, backgroundColor: colors.accent }]}
            />
          </View>
        );
      })}
    </View>
  );
});

const MEASUREMENT_TYPES: { type: MeasurementType; label: string }[] = [
  { type: 'waist', label: 'Waist' },
  { type: 'chest', label: 'Chest' },
  { type: 'arm', label: 'Arm' },
  { type: 'thigh', label: 'Thigh' },
];

const POSES: { pose: Pose; label: string }[] = [
  { pose: 'front', label: 'Front' },
  { pose: 'side', label: 'Side' },
  { pose: 'back', label: 'Back' },
];

function signedKcal(value: number): string {
  const rounded = Math.round(value);
  return rounded >= 0 ? `+${rounded}` : `${rounded}`;
}

/** Weekly check-in card (PRD §4.4) — on mount, shows an already-pulled/generated check-in for
 * this local week, generates a new one if the readiness gate is met, or a plain "not ready yet"
 * message otherwise. A `'pending'` decision is the only actionable state; anything else (already
 * decided, this device or another) renders as a past record. */
const CheckInCard = memo(function CheckInCard({ onDecided }: { onDecided: () => void }) {
  // Re-evaluated by remounting this component (see the `key={checkInVersion}` below) rather than
  // local setState — a decision changes which card variant renders, which is simplest as a fresh
  // read of local state on remount.
  const [state] = useState<CheckInRow | 'not-ready' | 'loading'>(() => {
    const existing = currentWeekCheckIn();
    if (existing) return existing;
    const generated = generateCheckIn();
    if (generated === 'already-exists') return currentWeekCheckIn() ?? 'not-ready';
    return generated;
  });
  const [editValue, setEditValue] = useState<string | null>(null);

  if (state === 'loading') return null;

  if (state === 'not-ready') {
    return (
      <Card style={styles.sectionCard}>
        <Typography variant="title">Weekly check-in</Typography>
        <Typography variant="body" color="secondary">
          Not enough logging history yet for this week&apos;s check-in — keep weighing in and
          logging food daily.
        </Typography>
      </Card>
    );
  }

  const checkIn = state;

  if (checkIn.decision !== 'pending') {
    return (
      <Card style={styles.sectionCard}>
        <Typography variant="title">Weekly check-in</Typography>
        <Typography variant="body" color="secondary">
          This week: {checkIn.decision}
          {checkIn.decision !== 'skipped' ? ` ${signedKcal(checkIn.suggestedKcal)} kcal/day` : ''}
        </Typography>
      </Card>
    );
  }

  const onAccept = () => {
    recordDecision(checkIn.id, 'accepted');
    onDecided();
  };
  const onSkip = () => {
    recordDecision(checkIn.id, 'skipped');
    onDecided();
  };
  const onConfirmEdit = () => {
    const value = Number(editValue);
    if (!Number.isFinite(value)) return;
    recordDecision(checkIn.id, 'edited', value);
    onDecided();
  };

  return (
    <Card style={styles.sectionCard}>
      <Typography variant="title">Weekly check-in</Typography>
      <Typography variant="body">
        Trend change: {checkIn.trendChange.toFixed(2)} kg/week
      </Typography>
      <Typography variant="bodyStrong">
        {signedKcal(checkIn.suggestedKcal)} kcal/day suggested
      </Typography>

      {editValue === null ? (
        <View style={styles.row}>
          <Button label="Accept" onPress={onAccept} />
          <Button variant="secondary" label="Edit" onPress={() => setEditValue(String(Math.round(checkIn.suggestedKcal)))} />
          <Button variant="secondary" label="Skip" onPress={onSkip} />
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.flexInput}>
            <TextField label="Kcal/day change" value={editValue} onChangeText={setEditValue} keyboardType="numbers-and-punctuation" />
          </View>
          <Button label="Confirm" onPress={onConfirmEdit} />
        </View>
      )}
    </Card>
  );
});

const MeasurementsSection = memo(function MeasurementsSection() {
  const [type, setType] = useState<MeasurementType>('waist');
  const [value, setValue] = useState('');
  const [rows, setRows] = useState<MeasurementRow[]>(() => listByType('waist'));

  const refresh = (t: MeasurementType) => setRows(listByType(t));

  const onSelectType = (t: MeasurementType) => {
    setType(t);
    refresh(t);
  };

  const onLog = () => {
    const valueCm = Number(value);
    if (!Number.isFinite(valueCm) || valueCm <= 0) return;
    logMeasurement(getLocalDateString(), type, valueCm);
    setValue('');
    refresh(type);
  };

  return (
    <Card style={styles.sectionCard}>
      <Typography variant="title">Measurements</Typography>
      <View style={styles.row}>
        {MEASUREMENT_TYPES.map((m) => (
          <Button
            key={m.type}
            label={m.label}
            variant={type === m.type ? 'primary' : 'secondary'}
            onPress={() => onSelectType(m.type)}
          />
        ))}
      </View>
      <View style={styles.row}>
        <View style={styles.flexInput}>
          <TextField label="Value (cm)" value={value} onChangeText={setValue} keyboardType="decimal-pad" />
        </View>
        <Button label="Log" onPress={onLog} />
      </View>
      {rows.slice(0, 5).map((row) => (
        <Typography key={row.id} variant="caption" color="secondary">
          {row.localDate}: {row.valueCm} cm
        </Typography>
      ))}
    </Card>
  );
});

const PhotosSection = memo(function PhotosSection() {
  const { colors } = useTheme();
  const [pose, setPose] = useState<Pose>('front');
  const [photos, setPhotos] = useState<PhotoRow[]>(() => listPhotos('front'));
  const [selected, setSelected] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  const refresh = (p: Pose) => setPhotos(listPhotos(p));

  const onSelectPose = (p: Pose) => {
    setPose(p);
    setSelected([]);
    refresh(p);
  };

  const onPick = async () => {
    setPickError(null);
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled || !result.assets?.[0]) return;
      await savePhoto(getLocalDateString(), pose, result.assets[0].uri);
      refresh(pose);
    } catch (err) {
      // Covers both a denied library-access permission and a failed file copy in savePhoto —
      // either way the picker/save previously failed silently with no visible feedback.
      setPickError(err instanceof Error ? err.message : 'Could not add that photo — check photo library access and try again.');
    } finally {
      setPicking(false);
    }
  };

  const onToggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const comparePhotos = photos.filter((p) => selected.includes(p.id));

  return (
    <Card style={styles.sectionCard}>
      <Typography variant="title">Progress photos</Typography>
      <Typography variant="caption" color="secondary">
        Stored only on this device — not backed up or synced.
      </Typography>
      <View style={styles.row}>
        {POSES.map((p) => (
          <Button
            key={p.pose}
            label={p.label}
            variant={pose === p.pose ? 'primary' : 'secondary'}
            onPress={() => onSelectPose(p.pose)}
          />
        ))}
      </View>
      <Button variant="secondary" label={picking ? 'Adding photo…' : 'Add photo'} onPress={onPick} disabled={picking} />
      {pickError ? (
        <Typography variant="caption" color="danger">
          {pickError}
        </Typography>
      ) : null}

      {photos.length === 0 ? (
        <Typography variant="caption" color="secondary">
          No {pose} photos yet.
        </Typography>
      ) : null}

      {comparePhotos.length === 2 ? (
        <View style={styles.compareRow}>
          {comparePhotos.map((p) => (
            <Image key={p.id} source={{ uri: p.filePath }} style={styles.comparePhoto} />
          ))}
        </View>
      ) : null}

      <View style={styles.photoGrid}>
        {photos.map((p) => (
          <Image
            key={p.id}
            source={{ uri: p.filePath }}
            style={[
              styles.thumb,
              selected.includes(p.id) ? { borderWidth: 2, borderColor: colors.accent } : null,
            ]}
            onTouchEnd={() => onToggleSelect(p.id)}
          />
        ))}
      </View>
    </Card>
  );
});

/**
 * Progress tab (PRD §3.5, §4.3, §4.4) — trend chart (plain bars, no chart library), the weekly
 * adaptive check-in, measurements and local-only progress photos, built around the existing
 * weigh-in logging from Phase 2.
 */
export default function ProgressScreen() {
  const { colors } = useTheme();
  const { status, lastError } = useSyncStatusStore();
  const [weightInput, setWeightInput] = useState('');
  const [entries, setEntries] = useState<WeightEntryRow[]>(() => listWeightEntries());
  const [checkInVersion, setCheckInVersion] = useState(0);

  const refresh = () => setEntries(listWeightEntries());

  const onSyncNow = () => {
    retryNow();
    refresh();
  };

  const onLog = () => {
    const weightKg = Number(weightInput);
    if (!Number.isFinite(weightKg) || weightKg <= 0) return;
    const localDate = getLocalDateString();
    logWeight(localDate, weightKg);
    setWeightInput('');
    refresh();
  };

  // Memoized so typing in the weigh-in input (or any state change in a sibling section) doesn't
  // re-run the EMA trend calculation over the full weigh-in history on every keystroke.
  const trendSeries = useMemo(
    () => calculateTrendSeries(entries.map((e) => ({ localDate: e.localDate, weightKg: e.weightKg }))),
    [entries],
  );
  const weeklyRate = useMemo(() => weeklyRateFromSeries(trendSeries), [trendSeries]);
  const onCheckInDecided = useCallback(() => setCheckInVersion((v) => v + 1), []);

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={entries}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <Typography variant="headline">Progress</Typography>

          <View style={styles.row}>
            <View style={styles.flexInput}>
              <TextField
                label="Weight (kg)"
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
              />
            </View>
            <Button label="Log weight" onPress={onLog} />
          </View>

          <Card style={styles.sectionCard}>
            <Typography variant="title">Trend</Typography>
            <TrendBars series={trendSeries} />
            <Typography variant="body" color="secondary">
              {weeklyRate !== null ? `${weeklyRate.toFixed(2)} kg/week` : 'Not enough data yet'}
            </Typography>
          </Card>

          <CheckInCard onDecided={onCheckInDecided} key={checkInVersion} />

          <MeasurementsSection />
          <PhotosSection />

          <Card style={styles.statusCard}>
            <Typography variant="bodyStrong">Sync: {status}</Typography>
            {lastError ? (
              <Typography variant="caption" color="danger">
                {lastError}
              </Typography>
            ) : null}
            <Button label="Sync now" variant="secondary" onPress={onSyncNow} />
          </Card>

          <Typography variant="title">Weigh-ins</Typography>
        </>
      }
      renderItem={({ item }) => (
        <View style={[styles.entryRow, { borderBottomColor: colors.border }]}>
          <Typography variant="body">{item.localDate}</Typography>
          <Typography variant="body">{item.weightKg} kg</Typography>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  flexInput: {
    flex: 1,
  },
  statusCard: {
    gap: spacing.xs,
  },
  sectionCard: {
    gap: spacing.sm,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 60,
  },
  trendBarTrack: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: radius.sm,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  compareRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  comparePhoto: {
    flex: 1,
    height: 160,
    borderRadius: radius.md,
  },
});
