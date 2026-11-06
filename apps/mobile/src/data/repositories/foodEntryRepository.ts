import { and, eq, isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import { foodEntry, outbox, type FoodEntryRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildLogFoodEntryChange, buildQuickAddChange, type MealSlot } from './foodEntryLogic';

export function logEntry(localDate: string, mealSlot: MealSlot, foodId: string, servings: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildLogFoodEntryChange({
    localDate,
    mealSlot,
    foodId,
    servings,
    now,
    newId: generateId(),
    newOpId: generateId(),
  });

  db.transaction((tx) => {
    tx.insert(foodEntry).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

export function quickAdd(
  localDate: string,
  mealSlot: MealSlot,
  name: string,
  kcal: number,
  proteinG: number,
  servings = 1,
): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildQuickAddChange({
    localDate,
    mealSlot,
    name,
    kcal,
    proteinG,
    servings,
    now,
    newId: generateId(),
    newOpId: generateId(),
  });

  db.transaction((tx) => {
    tx.insert(foodEntry).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

export function listForDate(localDate: string): FoodEntryRow[] {
  const db = getDb();
  return db
    .select()
    .from(foodEntry)
    .where(and(eq(foodEntry.localDate, localDate), isNull(foodEntry.deletedAt)))
    .all() as FoodEntryRow[];
}

function dayBefore(localDate: string): string {
  const d = new Date(`${localDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Re-logs yesterday's entries for `localDate` — each copy is a brand-new `food_entry` row, not a
 * reference, so editing today's copy never touches yesterday's (PRD §3.4 "copy yesterday"). */
export function copyYesterday(localDate: string): void {
  const yesterday = listForDate(dayBefore(localDate));
  for (const entry of yesterday) {
    if (entry.foodId) {
      logEntry(localDate, entry.mealSlot as MealSlot, entry.foodId, entry.servings);
    } else {
      quickAdd(
        localDate,
        entry.mealSlot as MealSlot,
        entry.quickAddName ?? 'Quick add',
        entry.quickAddKcal ?? 0,
        entry.quickAddProteinG ?? 0,
        entry.servings,
      );
    }
  }
}
