import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, radius, spacing, TextField, Typography, useTheme } from '../../src/design';
import { copyYesterday, listForDate, logEntry, quickAdd } from '../../src/data/repositories/foodEntryRepository';
import { recentFoods, resolvedNutritionFor, searchFoods } from '../../src/data/repositories/foodRepository';
import { create as createSavedMeal, list as listSavedMeals } from '../../src/data/repositories/savedMealRepository';
import { latestTargets } from '../../src/data/repositories/targetsRepository';
import { hasSessionForDate } from '../../src/data/repositories/workoutSessionRepository';
import type { FoodEntryRow, FoodRow, SavedMealRow } from '../../src/data/db/schema';
import type { MealSlot } from '../../src/data/repositories/foodEntryLogic';
import { getLocalDateString } from '../../src/platform/localDate';

const SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: 'breakfast', label: 'Breakfast' },
  { slot: 'lunch', label: 'Lunch' },
  { slot: 'snacks', label: 'Snacks' },
  { slot: 'dinner', label: 'Dinner' },
];

type AddSheet = { slot: MealSlot; mode: 'menu' | 'search' | 'quickAdd' | 'savedMeal' } | null;
type BuilderItem = { foodId: string; name: string; servings: string };

/** Thin horizontal progress bar (Food's top calorie/protein stat cards in the reference UI
 * mockup) — plain View-in-View, matches the existing Bar pattern already used on the Today tab,
 * kept local here since it's a two-line pattern, not worth a new shared component for. */
function MacroBar({ value, target }: { value: number; target: number }) {
  const { colors } = useTheme();
  const pct = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
  return (
    <View style={[styles.barTrack, { backgroundColor: colors.surfaceAlt }]}>
      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: colors.accent }]} />
    </View>
  );
}

/** Small outlined pill button (the "+ Add food" affordance in the reference UI mockup) — distinct
 * from the shared `Button` component's filled primary/secondary styles, so kept local here rather
 * than adding a third variant to the shared component for one screen's use. */
function PillButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pillButton, { borderColor: colors.accent }]}
      accessibilityRole="button"
    >
      <Typography variant="caption" color="accent">
        {label}
      </Typography>
    </Pressable>
  );
}

/**
 * Food tab (PRD §3.4) — meals by slot, search, saved meals, copy yesterday, quick-add. Barcode
 * scanning and a full public food database are explicitly out of scope (PRD non-goals).
 */
export default function FoodScreen() {
  const { colors } = useTheme();
  const today = getLocalDateString();

  const [allFoods] = useState<FoodRow[]>(() => searchFoods(''));
  const foodById = useCallback((id: string) => allFoods.find((f) => f.id === id), [allFoods]);

  // Computed once per screen mount, same as `allFoods` above — the "Recent" section is a
  // convenience shortcut on top of the full browse-all list, not a live view.
  const [recentFoodsList] = useState<FoodRow[]>(() => recentFoods());

  const [entries, setEntries] = useState<FoodEntryRow[]>(() => listForDate(today));
  const refresh = useCallback(() => setEntries(listForDate(today)), [today]);
  useFocusEffect(refresh);

  // Targets + today's training-day status, same resolution rule as todaySummary.ts (training
  // days use the higher calorie target) — computed locally here rather than importing that
  // screen's module, to stay inside this file per scope.
  const targets = useMemo(() => latestTargets(), []);
  const trainedToday = useMemo(() => hasSessionForDate(today), [today]);
  const caloriesTarget = targets ? (trainedToday ? targets.kcalTraining : targets.kcalRest) : 0;
  const proteinTarget = targets?.proteinG ?? 0;

  const [sheet, setSheet] = useState<AddSheet>(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodRow[]>([]);
  const [quickName, setQuickName] = useState('');
  const [quickKcal, setQuickKcal] = useState('');
  const [quickProtein, setQuickProtein] = useState('');
  const [savedMeals, setSavedMeals] = useState<SavedMealRow[]>([]);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderName, setBuilderName] = useState('');
  const [builderQuery, setBuilderQuery] = useState('');
  const [builderResults, setBuilderResults] = useState<FoodRow[]>([]);
  const [builderItems, setBuilderItems] = useState<BuilderItem[]>([]);

  function nutritionFor(entry: FoodEntryRow): { kcal: number; proteinG: number } {
    if (entry.foodId) {
      const resolved = resolvedNutritionFor(entry.foodId);
      return resolved
        ? { kcal: resolved.kcal * entry.servings, proteinG: resolved.proteinG * entry.servings }
        : { kcal: 0, proteinG: 0 };
    }
    return {
      kcal: (entry.quickAddKcal ?? 0) * entry.servings,
      proteinG: (entry.quickAddProteinG ?? 0) * entry.servings,
    };
  }

  // `resolvedNutritionFor` hits SQLite (base food + override lookup) per entry — computing this
  // once per entry here, keyed only on `entries`, is what keeps typing in any of this screen's
  // text fields from re-running up to 2x N queries on every keystroke (it previously ran inline
  // in the render body, with no memoization at all). Preserved exactly across this redesign.
  const nutritionByEntryId = useMemo(() => {
    const map = new Map<string, { kcal: number; proteinG: number }>();
    for (const entry of entries) {
      map.set(entry.id, nutritionFor(entry));
    }
    return map;
  }, [entries]);

  const totals = useMemo(() => {
    let kcal = 0;
    let proteinG = 0;
    for (const n of nutritionByEntryId.values()) {
      kcal += n.kcal;
      proteinG += n.proteinG;
    }
    return { kcal, proteinG };
  }, [nutritionByEntryId]);

  const slotTotals = useMemo(() => {
    const map = new Map<MealSlot, { kcal: number; proteinG: number }>();
    for (const { slot } of SLOTS) {
      let kcal = 0;
      let proteinG = 0;
      for (const entry of entries) {
        if (entry.mealSlot !== slot) continue;
        const n = nutritionByEntryId.get(entry.id) ?? { kcal: 0, proteinG: 0 };
        kcal += n.kcal;
        proteinG += n.proteinG;
      }
      map.set(slot, { kcal, proteinG });
    }
    return map;
  }, [entries, nutritionByEntryId]);

  const entryName = (entry: FoodEntryRow): string =>
    entry.foodId ? (foodById(entry.foodId)?.name ?? 'Food') : (entry.quickAddName ?? 'Quick add');

  const entrySubtitle = (entry: FoodEntryRow): string => {
    if (entry.foodId) {
      const unit = foodById(entry.foodId)?.servingUnit;
      return unit ? `${entry.servings} ${unit}` : `${entry.servings} serving${entry.servings === 1 ? '' : 's'}`;
    }
    return 'Quick add';
  };

  const openMenu = (slot: MealSlot) => setSheet({ slot, mode: 'menu' });

  /** Top-right global "+" button: defaults to the first meal slot with nothing logged yet today,
   * falling back to Snacks (a reasonable catch-all) once every slot has something — avoids
   * duplicating the whole add flow a second time for a single extra entry point. */
  const onGlobalAdd = () => {
    const emptySlot = SLOTS.find(({ slot }) => !entries.some((e) => e.mealSlot === slot));
    openMenu(emptySlot?.slot ?? 'snacks');
  };

  const openSearch = () => {
    if (!sheet) return;
    setQuery('');
    setSearchResults(allFoods);
    setSheet({ ...sheet, mode: 'search' });
  };

  const openQuickAdd = () => {
    if (!sheet) return;
    setQuickName('');
    setQuickKcal('');
    setQuickProtein('');
    setSheet({ ...sheet, mode: 'quickAdd' });
  };

  const openSavedMeal = () => {
    if (!sheet) return;
    setSavedMeals(listSavedMeals());
    setSheet({ ...sheet, mode: 'savedMeal' });
  };

  const onSearchChange = (text: string) => {
    setQuery(text);
    setSearchResults(searchFoods(text));
  };

  const onLogFood = (foodId: string) => {
    if (!sheet) return;
    logEntry(today, sheet.slot, foodId, 1);
    setSheet(null);
    refresh();
  };

  const onQuickAddConfirm = () => {
    if (!sheet) return;
    const kcal = Number(quickKcal);
    const proteinG = Number(quickProtein);
    if (!quickName.trim() || !Number.isFinite(kcal) || kcal < 0 || !Number.isFinite(proteinG) || proteinG < 0) return;
    quickAdd(today, sheet.slot, quickName.trim(), kcal, proteinG);
    setSheet(null);
    refresh();
  };

  const onLogSavedMeal = (meal: SavedMealRow) => {
    if (!sheet) return;
    const items = JSON.parse(meal.itemsJson) as { foodId: string; servings: number }[];
    for (const item of items) {
      logEntry(today, sheet.slot, item.foodId, item.servings);
    }
    setSheet(null);
    refresh();
  };

  const onCopyYesterday = () => {
    copyYesterday(today);
    refresh();
  };

  const openBuilder = () => {
    setBuilderName('');
    setBuilderItems([]);
    setBuilderQuery('');
    setBuilderResults(allFoods);
    setBuilderOpen(true);
  };

  const onBuilderQueryChange = (text: string) => {
    setBuilderQuery(text);
    setBuilderResults(searchFoods(text));
  };

  const addBuilderItem = (foodRow: FoodRow) => {
    setBuilderItems((prev) => [...prev, { foodId: foodRow.id, name: foodRow.name, servings: '1' }]);
  };

  const updateBuilderServings = (index: number, servings: string) => {
    setBuilderItems((prev) => prev.map((item, i) => (i === index ? { ...item, servings } : item)));
  };

  // Shared row renderers — used both for the "Recent" section and the full list below it, so the
  // two look identical and styling only lives in one place. `keyPrefix` keeps React keys unique
  // when the same food appears in both sections at once.
  const renderSearchRow = (f: FoodRow, keyPrefix = '') => (
    <Pressable
      key={`${keyPrefix}${f.id}`}
      onPress={() => onLogFood(f.id)}
      style={[styles.modalRow, { borderTopColor: colors.border }]}
    >
      <Typography variant="body">{f.name}</Typography>
      <Typography variant="caption" color="secondary">
        {f.kcal} kcal / {f.servingUnit}
      </Typography>
    </Pressable>
  );

  const renderBuilderRow = (f: FoodRow, keyPrefix = '') => (
    <Pressable
      key={`${keyPrefix}${f.id}`}
      onPress={() => addBuilderItem(f)}
      style={[styles.modalRow, { borderTopColor: colors.border }]}
    >
      <Typography variant="body">{f.name}</Typography>
    </Pressable>
  );

  const onSaveBuilder = () => {
    const items = builderItems
      .map((item) => ({ foodId: item.foodId, servings: Number(item.servings) }))
      .filter((item) => Number.isFinite(item.servings) && item.servings > 0);
    if (!builderName.trim() || items.length === 0) return;
    createSavedMeal(builderName.trim(), items);
    setBuilderOpen(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Typography variant="headline">Food</Typography>
        <Pressable onPress={onGlobalAdd} accessibilityRole="button" accessibilityLabel="Quick add food">
          <Ionicons name="add-circle" size={36} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Typography variant="caption" color="secondary">
            Calories
          </Typography>
          <View style={styles.statValueRow}>
            <Typography variant="statLarge">{Math.round(totals.kcal).toLocaleString()}</Typography>
            <Typography variant="statUnit" color="secondary">
              {' '}
              / {Math.round(caloriesTarget).toLocaleString()} kcal
            </Typography>
          </View>
          <MacroBar value={totals.kcal} target={caloriesTarget} />
        </Card>
        <Card style={styles.statCard}>
          <Typography variant="caption" color="secondary">
            Protein
          </Typography>
          <View style={styles.statValueRow}>
            <Typography variant="statLarge">{Math.round(totals.proteinG)}</Typography>
            <Typography variant="statUnit" color="secondary">
              {' '}
              / {Math.round(proteinTarget)} g
            </Typography>
          </View>
          <MacroBar value={totals.proteinG} target={proteinTarget} />
        </Card>
      </View>

      <View style={styles.row}>
        <Button variant="secondary" label="Copy yesterday" onPress={onCopyYesterday} />
        <Button variant="secondary" label="New saved meal" onPress={openBuilder} />
      </View>

      {SLOTS.map(({ slot, label }) => {
        const slotEntries = entries.filter((e) => e.mealSlot === slot);
        const slotTotal = slotTotals.get(slot) ?? { kcal: 0, proteinG: 0 };
        return (
          <Card key={slot} style={styles.slotCard}>
            <View style={styles.slotHeaderRow}>
              <View>
                <Typography variant="title">{label}</Typography>
                {slotEntries.length > 0 ? (
                  <Typography variant="caption" color="secondary">
                    {Math.round(slotTotal.kcal)} kcal · {Math.round(slotTotal.proteinG)} g protein
                  </Typography>
                ) : null}
              </View>
              <PillButton label="+ Add food" onPress={() => openMenu(slot)} />
            </View>
            {slotEntries.length === 0 ? (
              <Typography variant="caption" color="secondary">
                Nothing logged yet
              </Typography>
            ) : (
              slotEntries.map((entry) => {
                const n = nutritionByEntryId.get(entry.id) ?? { kcal: 0, proteinG: 0 };
                return (
                  <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.iconBadge, { backgroundColor: colors.surfaceAlt }]}>
                      <Ionicons name="nutrition-outline" size={18} color={colors.accent} />
                    </View>
                    <View style={styles.entryTextCol}>
                      <Typography variant="body">{entryName(entry)}</Typography>
                      <Typography variant="caption" color="secondary">
                        {entrySubtitle(entry)}
                      </Typography>
                    </View>
                    <Typography variant="body" color="secondary">
                      {Math.round(n.kcal)} kcal
                    </Typography>
                    {/* Decorative for now — no per-entry edit/delete exists in foodEntryRepository
                        yet, and adding one is outside this screen-only redesign's scope. */}
                    <Ionicons
                      name="ellipsis-vertical"
                      size={16}
                      color={colors.textSecondary}
                      style={styles.entryOverflow}
                    />
                  </View>
                );
              })
            )}
          </Card>
        );
      })}

      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={styles.modalBackdrop}>
          <Card style={[styles.modalCard, { backgroundColor: colors.background }]}>
            {sheet?.mode === 'menu' ? (
              <>
                <Typography variant="title">Add to {SLOTS.find((s) => s.slot === sheet.slot)?.label}</Typography>
                <Button label="Search food" onPress={openSearch} />
                <Button label="Saved meal" onPress={openSavedMeal} />
                <Button label="Quick add" onPress={openQuickAdd} />
                <Button variant="secondary" label="Cancel" onPress={() => setSheet(null)} />
              </>
            ) : null}

            {sheet?.mode === 'search' ? (
              <>
                <TextField label="Search foods" value={query} onChangeText={onSearchChange} />
                {searchResults.length === 0 ? (
                  <Typography variant="caption" color="secondary">
                    No foods match &quot;{query}&quot; — try a different search, or use Quick add instead.
                  </Typography>
                ) : null}
                <ScrollView style={styles.modalList}>
                  {query.trim().length === 0 && recentFoodsList.length > 0 ? (
                    <>
                      <Typography variant="caption" color="secondary" style={styles.listSectionHeader}>
                        Recent
                      </Typography>
                      {recentFoodsList.map((f) => renderSearchRow(f, 'recent-'))}
                      <Typography variant="caption" color="secondary" style={styles.listSectionHeader}>
                        All foods
                      </Typography>
                    </>
                  ) : null}
                  {searchResults.map((f) => renderSearchRow(f))}
                </ScrollView>
                <Button variant="secondary" label="Cancel" onPress={() => setSheet(null)} />
              </>
            ) : null}

            {sheet?.mode === 'quickAdd' ? (
              <>
                <TextField label="Name" value={quickName} onChangeText={setQuickName} />
                <TextField label="Calories" value={quickKcal} onChangeText={setQuickKcal} keyboardType="number-pad" />
                <TextField label="Protein (g)" value={quickProtein} onChangeText={setQuickProtein} keyboardType="number-pad" />
                <Button label="Add" onPress={onQuickAddConfirm} />
                <Button variant="secondary" label="Cancel" onPress={() => setSheet(null)} />
              </>
            ) : null}

            {sheet?.mode === 'savedMeal' ? (
              <>
                <Typography variant="title">Saved meals</Typography>
                {savedMeals.length === 0 ? (
                  <Typography variant="caption" color="secondary">
                    No saved meals yet — create one from the button above.
                  </Typography>
                ) : (
                  savedMeals.map((meal) => (
                    <Pressable
                      key={meal.id}
                      onPress={() => onLogSavedMeal(meal)}
                      style={[styles.modalRow, { borderTopColor: colors.border }]}
                    >
                      <Typography variant="body">{meal.name}</Typography>
                    </Pressable>
                  ))
                )}
                <Button variant="secondary" label="Cancel" onPress={() => setSheet(null)} />
              </>
            ) : null}
          </Card>
        </View>
      </Modal>

      <Modal visible={builderOpen} transparent animationType="slide" onRequestClose={() => setBuilderOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Card style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <Typography variant="title">New saved meal</Typography>
            <TextField label="Name" value={builderName} onChangeText={setBuilderName} />
            <TextField label="Add food" value={builderQuery} onChangeText={onBuilderQueryChange} />
            <ScrollView style={styles.modalList}>
              {builderQuery.trim().length === 0 && recentFoodsList.length > 0 ? (
                <>
                  <Typography variant="caption" color="secondary" style={styles.listSectionHeader}>
                    Recent
                  </Typography>
                  {recentFoodsList.map((f) => renderBuilderRow(f, 'recent-'))}
                  <Typography variant="caption" color="secondary" style={styles.listSectionHeader}>
                    All foods
                  </Typography>
                </>
              ) : null}
              {builderResults.map((f) => renderBuilderRow(f))}
            </ScrollView>
            {builderItems.map((item, index) => (
              <View key={`${item.foodId}-${index}`} style={styles.row}>
                <Typography variant="body" style={styles.flexInput}>
                  {item.name}
                </Typography>
                <View style={styles.servingsInput}>
                  <TextField
                    label="Servings"
                    value={item.servings}
                    onChangeText={(v) => updateBuilderServings(index, v)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            ))}
            <Button label="Save meal" onPress={onSaveBuilder} />
            <Button variant="secondary" label="Cancel" onPress={() => setBuilderOpen(false)} />
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, gap: spacing.xs },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' },
  barTrack: { height: 6, borderRadius: radius.sm, overflow: 'hidden', marginTop: spacing.xs },
  barFill: { height: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  slotCard: { gap: spacing.xs },
  slotHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pillButton: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTextCol: { flex: 1 },
  entryOverflow: { paddingHorizontal: spacing.xs },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, gap: spacing.sm, maxHeight: '85%' },
  modalList: { maxHeight: 300 },
  modalRow: { paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  listSectionHeader: { paddingTop: spacing.xs },
  flexInput: { flex: 1 },
  servingsInput: { width: 100 },
});
