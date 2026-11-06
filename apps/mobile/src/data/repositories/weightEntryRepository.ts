import { desc, eq, isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, weightEntry, type WeightEntryRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildLogWeightChange } from './weightEntryLogic';

/** Writes locally and enqueues one outbox op in the same transaction (PRD §7.5 step 1). */
export function logWeight(localDate: string, weightKg: number): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.transaction((tx) => {
    const existing = (tx.select().from(weightEntry).where(eq(weightEntry.localDate, localDate)).all()[0] ??
      null) as WeightEntryRow | null;

    const { entry, outboxRow } = buildLogWeightChange({
      existing,
      localDate,
      weightKg,
      now,
      newId: generateId(),
      newOpId: generateId(),
    });

    if (existing) {
      tx.update(weightEntry).set(entry).where(eq(weightEntry.id, entry.id)).run();
    } else {
      tx.insert(weightEntry).values(entry).run();
    }
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

export function listWeightEntries(): WeightEntryRow[] {
  const db = getDb();
  return db
    .select()
    .from(weightEntry)
    .where(isNull(weightEntry.deletedAt))
    .orderBy(desc(weightEntry.localDate))
    .all() as WeightEntryRow[];
}
