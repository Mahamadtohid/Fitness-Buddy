import { and, desc, eq, inArray, isNull, like, sql } from 'drizzle-orm';

import { getDb } from '../db/client';
import { food, foodEntry, foodOverride, outbox, type FoodOverrideRow, type FoodRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildCreateCustomFoodChange, buildSetFoodOverrideChange, type CustomFoodInput, type FoodOverrideInput } from './foodLogic';

export function searchFoods(query: string): FoodRow[] {
  const db = getDb();
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return db.select().from(food).where(isNull(food.deletedAt)).orderBy(food.name).all() as FoodRow[];
  }
  return db
    .select()
    .from(food)
    .where(and(like(food.name, `%${trimmed}%`), isNull(food.deletedAt)))
    .orderBy(food.name)
    .all() as FoodRow[];
}

/**
 * Foods the user has actually logged recently (PRD-adjacent convenience: surface what they reach
 * for most, above the full alphabetical list). Groups non-deleted `food_entry` rows by `foodId`
 * (quick-adds have a null `foodId` and are excluded — there's no catalog row to show), orders by
 * each food's most recent log time, then resolves the top `limit` ids back to their `food` rows
 * (excluding soft-deleted foods), preserving that recency order.
 */
export function recentFoods(limit: number = 8): FoodRow[] {
  const db = getDb();

  const recentIds = db
    .select({
      foodId: foodEntry.foodId,
      lastLoggedAt: sql<string>`max(${foodEntry.createdAt})`.as('last_logged_at'),
    })
    .from(foodEntry)
    .where(and(sql`${foodEntry.foodId} IS NOT NULL`, isNull(foodEntry.deletedAt)))
    .groupBy(foodEntry.foodId)
    .orderBy(desc(sql`last_logged_at`))
    .limit(limit)
    .all() as { foodId: string; lastLoggedAt: string }[];

  if (recentIds.length === 0) return [];

  const foodRows = db
    .select()
    .from(food)
    .where(and(inArray(food.id, recentIds.map((r) => r.foodId)), isNull(food.deletedAt)))
    .all() as FoodRow[];

  const byId = new Map(foodRows.map((row) => [row.id, row]));
  return recentIds.map((r) => byId.get(r.foodId)).filter((row): row is FoodRow => row !== undefined);
}

export function createCustomFood(input: CustomFoodInput): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildCreateCustomFoodChange({ input, now, newId: generateId(), newOpId: generateId() });

  db.transaction((tx) => {
    tx.insert(food).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

export function setFoodOverride(foodId: string, values: FoodOverrideInput): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.transaction((tx) => {
    const existing = (tx.select().from(foodOverride).where(eq(foodOverride.foodId, foodId)).all()[0] ??
      null) as FoodOverrideRow | null;

    const { entry, outboxRow } = buildSetFoodOverrideChange({
      existing,
      foodId,
      values,
      now,
      newId: generateId(),
      newOpId: generateId(),
    });

    if (existing) {
      tx.update(foodOverride).set(entry).where(eq(foodOverride.id, entry.id)).run();
    } else {
      tx.insert(foodOverride).values(entry).run();
    }
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

export type ResolvedNutrition = { kcal: number; proteinG: number; carbG: number; fatG: number };

/** Applies an active `food_override` on top of the base `food` row, if one exists. */
export function resolvedNutritionFor(foodId: string): ResolvedNutrition | null {
  const db = getDb();
  const base = (db.select().from(food).where(eq(food.id, foodId)).all()[0] ?? null) as FoodRow | null;
  if (!base) return null;

  const override = (db.select().from(foodOverride).where(eq(foodOverride.foodId, foodId)).all()[0] ??
    null) as FoodOverrideRow | null;

  if (override && override.deletedAt === null) {
    return { kcal: override.kcal, proteinG: override.proteinG, carbG: override.carbG, fatG: override.fatG };
  }
  return { kcal: base.kcal, proteinG: base.proteinG, carbG: base.carbG, fatG: base.fatG };
}
