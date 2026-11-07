import { memo, useCallback, useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, LineChart, Sparkline, radius, spacing, TextField, Typography, useTheme } from '../../src/design';
import { listWeightEntries, logWeight } from '../../src/data/repositories/weightEntryRepository';
import { retryNow, useSyncStatusStore } from '../../src/data/sync';
import type { CheckInRow, MeasurementRow, PhotoRow, WeightEntryRow } from '../../src/data/db/schema';
import { getLocalDateString } from '../../src/platform/localDate';
import { calculateTrendSeries, weeklyRateFromSeries } from '../../src/domain/trend';
import { currentWeekCheckIn, generateCheckIn, recordDecision } from '../../src/data/repositories/checkInRepository';
import { logMeasurement, listByType } from '../../src/data/repositories/measurementRepository';
import type { MeasurementType } from '../../src/data/repositories/measurementLogic';
import { savePhoto, listPhotos, type Pose } from '../../src/data/repositories/photoRepository';
import { getWeeklyProgressStats, type WeeklyProgressStats } from '../../src/data/repositories/progressStats';
import { getProfile } from '../../src/data/repositories/profileRepository';
import { kgToLb, formatLength, formatWeight, parseLengthInput, parseWeightInput, type Units } from '../../src/domain/units';

const CHART_WINDOW_DAYS = 7;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-05-08" -> "May 8" — hand-formatted rather than `Intl.DateTimeFormat` to avoid depending
 * on full-ICU data being bundled into the Hermes build (not something this project has verified). */
function formatChartLabel(localDate: string): string {
  const [, month, day] = localDate.split('-');
  return `${MONTH_SHORT[Number(month) - 1]} ${Number(day)}`;
}

/** Signed delta line with a direction arrow (reference UI mockup's "▼0.6 kg vs last week" /
 * "▼134 kcal" style badges). Not a design-system primitive — only used in this one screen. */
function TrendDelta({ value, formatAbs, suffix }: { value: number; formatAbs: (abs: number) => string; suffix: string }) {
  const { colors } = useTheme();
  const iconName = value < 0 ? 'arrow-down' : value > 0 ? 'arrow-up' : 'remove';
  return (
    <View style={styles.deltaRow}>
      <Ionicons name={iconName} size={14} color={colors.accent} />
      <Typography variant="caption" color="accent">
        {formatAbs(Math.abs(value))} {suffix}
      </Typography>
    </View>
  );
}

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
const CheckInCard = memo(function CheckInCard({ onDecided, units }: { onDecided: () => void; units: Units }) {
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
        Trend change: {units === 'imperial' ? kgToLb(checkIn.trendChange).toFixed(2) : checkIn.trendChange.toFixed(2)}{' '}
        {units === 'imperial' ? 'lb' : 'kg'}/week
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

const MeasurementsSection = memo(function MeasurementsSection({ units }: { units: Units }) {
  const [type, setType] = useState<MeasurementType>('waist');
  const [value, setValue] = useState('');
  const [rows, setRows] = useState<MeasurementRow[]>(() => listByType('waist'));

  const refresh = (t: MeasurementType) => setRows(listByType(t));

  const onSelectType = (t: MeasurementType) => {
    setType(t);
    refresh(t);
  };

  const onLog = () => {
    const valueCm = parseLengthInput(value, units);
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
          <TextField
            label={units === 'imperial' ? 'Value (in)' : 'Value (cm)'}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
          />
        </View>
        <Button label="Log" onPress={onLog} />
      </View>
      {rows.slice(0, 5).map((row) => (
        <Typography key={row.id} variant="caption" color="secondary">
          {row.localDate}: {formatLength(row.valueCm, units)}
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
  // Computed alongside `entries` in the same `refresh()` this screen already calls after its own
  // actions (logging a weigh-in, syncing) — this screen has no focus-effect refresh today, so
  // matching that existing convention rather than introducing a new one for just this.
  const [weeklyStats, setWeeklyStats] = useState<WeeklyProgressStats>(() => getWeeklyProgressStats());
  const [units, setUnits] = useState<Units>(() => (getProfile()?.units as Units) ?? 'metric');

  const refresh = () => {
    setEntries(listWeightEntries());
    setWeeklyStats(getWeeklyProgressStats());
    setUnits((getProfile()?.units as Units) ?? 'metric');
  };

  const onSyncNow = () => {
    retryNow();
    refresh();
  };

  const onLog = () => {
    const weightKg = parseWeightInput(weightInput, units);
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

  const chartPoints = useMemo(
    () =>
      trendSeries
        .slice(-CHART_WINDOW_DAYS)
        .map((t) => ({ label: formatChartLabel(t.localDate), value: t.trend })),
    [trendSeries],
  );
  const latestTrend = trendSeries.length > 0 ? trendSeries[trendSeries.length - 1].trend : null;

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={entries}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <View style={styles.headerRow}>
            <Typography variant="headline">Progress</Typography>
            <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
          </View>

          <Card style={styles.sectionCard}>
            <View style={styles.headerRow}>
              <Typography variant="title">Weight</Typography>
              <View style={[styles.rangeBadge, { backgroundColor: colors.surfaceAlt }]}>
                <Typography variant="caption" color="secondary">
                  7D
                </Typography>
              </View>
            </View>
            {latestTrend !== null ? (
              <View style={styles.statRow}>
                <Typography variant="statLarge">
                  {(units === 'imperial' ? kgToLb(latestTrend) : latestTrend).toFixed(1)}
                </Typography>
                <Typography variant="statUnit" color="secondary">
                  {' '}
                  {units === 'imperial' ? 'lb' : 'kg'}
                </Typography>
              </View>
            ) : null}
            {weeklyRate !== null ? (
              <TrendDelta
                value={weeklyRate}
                formatAbs={(abs) => (units === 'imperial' ? kgToLb(abs) : abs).toFixed(1)}
                suffix={units === 'imperial' ? 'lb vs last week' : 'kg vs last week'}
              />
            ) : (
              <Typography variant="caption" color="secondary">
                Not enough data yet
              </Typography>
            )}
            <LineChart points={chartPoints} />
          </Card>

          <Card style={styles.sectionCard}>
            <Typography variant="title">This week</Typography>
            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Typography variant="title">{weeklyStats.workoutsThisWeek}</Typography>
                <Typography variant="caption" color="secondary">
                  Workouts
                </Typography>
              </View>
              <View style={styles.statCell}>
                <Typography variant="title">{weeklyStats.daysLoggedThisWeek}/7</Typography>
                <Typography variant="caption" color="secondary">
                  Days
                </Typography>
              </View>
              <View style={styles.statCell}>
                <Typography variant="title">{Math.round(weeklyStats.avgKcal)}</Typography>
                <Typography variant="caption" color="secondary">
                  Avg kcal
                </Typography>
              </View>
              <View style={styles.statCell}>
                <Typography variant="title">{Math.round(weeklyStats.avgProteinG)} g</Typography>
                <Typography variant="caption" color="secondary">
                  Avg protein
                </Typography>
              </View>
            </View>
          </Card>

          <Card style={styles.sectionCard}>
            <Typography variant="title">Nutrition trends</Typography>
            <Typography variant="caption" color="secondary">
              7-day average
            </Typography>
            <View style={styles.trendsRow}>
              <View>
                <Typography variant="bodyStrong">{Math.round(weeklyStats.avgKcal)} kcal</Typography>
                <TrendDelta value={weeklyStats.kcalDeltaVsPriorWeek} formatAbs={(abs) => Math.round(abs).toString()} suffix="kcal" />
              </View>
              <Sparkline values={weeklyStats.dailyKcalSeries} />
            </View>
            <View style={styles.trendsRow}>
              <View>
                <Typography variant="bodyStrong">{Math.round(weeklyStats.avgProteinG)} g</Typography>
                <TrendDelta value={weeklyStats.proteinDeltaVsPriorWeek} formatAbs={(abs) => Math.round(abs).toString()} suffix="g" />
              </View>
              <Sparkline values={weeklyStats.dailyProteinSeries} />
            </View>
          </Card>

          <View style={styles.row}>
            <View style={styles.flexInput}>
              <TextField
                label={units === 'imperial' ? 'Weight (lb)' : 'Weight (kg)'}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
              />
            </View>
            <Button label="Log weight" onPress={onLog} />
          </View>

          <CheckInCard onDecided={onCheckInDecided} units={units} key={checkInVersion} />

          <MeasurementsSection units={units} />
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
          <Typography variant="body">{formatWeight(item.weightKg, units)}</Typography>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCell: {
    alignItems: 'center',
    gap: 2,
  },
  trendsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
