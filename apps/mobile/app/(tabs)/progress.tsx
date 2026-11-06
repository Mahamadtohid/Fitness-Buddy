import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Button, Card, spacing, TextField, Typography, useTheme } from '../../src/design';
import { listWeightEntries, logWeight } from '../../src/data/repositories/weightEntryRepository';
import { retryNow, useSyncStatusStore } from '../../src/data/sync';
import type { WeightEntryRow } from '../../src/data/db/schema';

/**
 * Minimal weigh-in screen — not the full Phase 5 Progress feature (no trend chart or weekly
 * check-in yet). Just enough real UI to exercise the sync engine end to end with weight_entry.
 * The list refreshes on user action (logging, pressing "Sync now") rather than reactively on
 * background pull completion — good enough to prove the pipeline without a DB-change subscriber.
 */
export default function ProgressScreen() {
  const { colors } = useTheme();
  const { status, lastError } = useSyncStatusStore();
  const [weightInput, setWeightInput] = useState('');
  const [entries, setEntries] = useState<WeightEntryRow[]>(() => listWeightEntries());

  const refresh = () => setEntries(listWeightEntries());

  const onSyncNow = () => {
    retryNow();
    refresh();
  };

  const onLog = () => {
    const weightKg = Number(weightInput);
    if (!Number.isFinite(weightKg) || weightKg <= 0) return;
    const localDate = new Date().toISOString().slice(0, 10);
    logWeight(localDate, weightKg);
    setWeightInput('');
    refresh();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Typography variant="headline">Weigh-in</Typography>

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

      <Card style={styles.statusCard}>
        <Typography variant="bodyStrong">Sync: {status}</Typography>
        {lastError ? (
          <Typography variant="caption" color="danger">
            {lastError}
          </Typography>
        ) : null}
        <Button label="Sync now" variant="secondary" onPress={onSyncNow} />
      </Card>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.entryRow, { borderBottomColor: colors.border }]}>
            <Typography variant="body">{item.localDate}</Typography>
            <Typography variant="body">{item.weightKg} kg</Typography>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  flexInput: {
    flex: 1,
  },
  statusCard: {
    gap: spacing.xs,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
