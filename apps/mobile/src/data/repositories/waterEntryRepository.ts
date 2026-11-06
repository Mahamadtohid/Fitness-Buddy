import { and, eq, isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, waterEntry, type WaterEntryRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildLogWaterChange } from './waterEntryLogic';
import { listWeightEntries } from './weightEntryRepository';
import { hasSessionForDate } from './workoutSessionRepository';
import { getLocalDateString } from '../../platform/localDate';

const ML_PER_KG = 35;
const TRAINING_DAY_BUMP_ML = 500;

export function logWater(ml: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildLogWaterChange({
    localDate: getLocalDateString(),
    ml,
    now,
    newId: generateId(),
    newOpId: generateId(),
  });

  db.transaction((tx) => {
    tx.insert(waterEntry).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

export function totalForDate(localDate: string): number {
  const db = getDb();
  const rows = db
    .select()
    .from(waterEntry)
    .where(and(eq(waterEntry.localDate, localDate), isNull(waterEntry.deletedAt)))
    .all() as WaterEntryRow[];
  return rows.reduce((sum, row) => sum + row.ml, 0);
}

/** PRD §3.6: 35 ml per kg of latest logged body weight, +500 ml on training days. Falls back to
 * 0 if no weigh-in exists yet (onboarding captures one, so this is only hit before that). */
export function waterTargetMl(): number {
  const latest = listWeightEntries()[0];
  if (!latest) return 0;
  const base = ML_PER_KG * latest.weightKg;
  return base + (hasSessionForDate(getLocalDateString()) ? TRAINING_DAY_BUMP_ML : 0);
}
