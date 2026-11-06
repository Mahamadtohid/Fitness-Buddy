import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, radius, spacing, TextField, Typography, useTheme } from '../../src/design';
import { copyYesterday, listForDate, logEntry, quickAdd } from '../../src/data/repositories/foodEntryRepository';
import { resolvedNutritionFor, searchFoods } from '../../src/data/repositories/foodRepository';
import { create as createSavedMeal, list as listSavedMeals } from '../../src/data/repositories/savedMealRepository';
import type { FoodEntryRow, FoodRow, SavedMealRow } from '../../src/data/db/schema';
import type { MealSlot } from '../../src/data/repositories/foodEntryLogic';

const SLOTS: { slot: MealSlot; label: string }[] = [
  { slot: 'breakfast', label: 'Breakfast' },
  { slot: 'lunch', label: 'Lunch' },
  { slot: 'snacks', label: 'Snacks' },
  { slot: 'dinner', label: 'Dinner' },
];

function todayLocalDate(): string {
  return new Date().toISOString().slice(0, 10);
}

type AddSheet = { slot: MealSlot; mode: 'menu' | 'search' | 'quickAdd' | 'savedMeal' } | null;
type BuilderItem = { foodId: string; name: string; servings: string };

/**
 * Food tab (PRD §3.4) — meals by slot, search, saved meals, copy yesterday, quick-add. Barcode
 * scanning and a full public food database are explicitly out of scope (PRD non-goals).
 */
export default function FoodScreen() {
  const { colors } = useTheme();
  const today = todayLocalDate();

  const [allFoods] = useState<FoodRow[]>(() => searchFoods(''));
  const foodNameById = useCallback((id: string) => allFoods.find((f) => f.id === id)?.name ?? 'Food', [allFoods]);

  const [entries, setEntries] = useState<FoodEntryRow[]>(() => listForDate(today));
  const refresh = useCallback(() => setEntries(listForDate(today)), [today]);
  useFocusEffect(refresh);

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

  const nutritionFor = (entry: FoodEntryRow): { kcal: number; proteinG: number } => {
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
  };

  const totals = entries.reduce(
    (acc, entry) => {
      const n = nutritionFor(entry);
      return { kcal: acc.kcal + n.kcal, proteinG: acc.proteinG + n.proteinG };
    },
    { kcal: 0, proteinG: 0 },
  );

  const entryName = (entry: FoodEntryRow): string =>
    entry.foodId ? foodNameById(entry.foodId) : (entry.quickAddName ?? 'Quick add');

  const openMenu = (slot: MealSlot) => setSheet({ slot, mode: 'menu' });

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
      <Typography variant="headline">Food</Typography>
      <Card style={styles.totalsCard}>
        <Typography variant="bodyStrong">
          {Math.round(totals.kcal)} kcal · {Math.round(totals.proteinG)} g protein today
        </Typography>
      </Card>

      <View style={styles.row}>
        <Button variant="secondary" label="Copy yesterday" onPress={onCopyYesterday} />
        <Button variant="secondary" label="New saved meal" onPress={openBuilder} />
      </View>

      {SLOTS.map(({ slot, label }) => {
        const slotEntries = entries.filter((e) => e.mealSlot === slot);
        return (
          <Card key={slot} style={styles.slotCard}>
            <View style={styles.row}>
              <Typography variant="title">{label}</Typography>
              <Button label="Add" onPress={() => openMenu(slot)} />
            </View>
            {slotEntries.length === 0 ? (
              <Typography variant="caption" color="secondary">
                Nothing logged yet
              </Typography>
            ) : (
              slotEntries.map((entry) => {
                const n = nutritionFor(entry);
                return (
                  <View key={entry.id} style={[styles.entryRow, { borderBottomColor: colors.border }]}>
                    <Typography variant="body">{entryName(entry)}</Typography>
                    <Typography variant="body" color="secondary">
                      {Math.round(n.kcal)} kcal
                    </Typography>
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
                <ScrollView style={styles.modalList}>
                  {searchResults.map((f) => (
                    <Pressable
                      key={f.id}
                      onPress={() => onLogFood(f.id)}
                      style={[styles.modalRow, { borderTopColor: colors.border }]}
                    >
                      <Typography variant="body">{f.name}</Typography>
                      <Typography variant="caption" color="secondary">
                        {f.kcal} kcal / {f.servingUnit}
                      </Typography>
                    </Pressable>
                  ))}
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
              {builderResults.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => addBuilderItem(f)}
                  style={[styles.modalRow, { borderTopColor: colors.border }]}
                >
                  <Typography variant="body">{f.name}</Typography>
                </Pressable>
              ))}
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
  totalsCard: { gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  slotCard: { gap: spacing.xs },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, gap: spacing.sm, maxHeight: '85%' },
  modalList: { maxHeight: 300 },
  modalRow: { paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  flexInput: { flex: 1 },
  servingsInput: { width: 100 },
});
