import { isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, savedMeal, type SavedMealRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildCreateSavedMealChange, type SavedMealItem } from './savedMealLogic';

export function list(): SavedMealRow[] {
  const db = getDb();
  return db.select().from(savedMeal).where(isNull(savedMeal.deletedAt)).all() as SavedMealRow[];
}

export function create(name: string, items: SavedMealItem[]): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildCreateSavedMealChange({ name, items, now, newId: generateId(), newOpId: generateId() });

  db.transaction((tx) => {
    tx.insert(savedMeal).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}
