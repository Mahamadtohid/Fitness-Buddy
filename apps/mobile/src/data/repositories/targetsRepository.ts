import { desc } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, target, type TargetRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildCreateTargetsChange, type TargetSource, type TargetValues } from './targetsLogic';

export function latestTargets(): TargetRow | null {
  const db = getDb();
  return (db.select().from(target).orderBy(desc(target.effectiveFrom)).limit(1).all()[0] ?? null) as TargetRow | null;
}

/** Always a fresh insert (mirrors `workoutSessionRepository.startSession`'s plain-insert shape) —
 * targets are append-only history (PRD §8.3), never edited in place. */
export function createTargets(values: TargetValues, source: TargetSource): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildCreateTargetsChange({ values, source, now, newId: generateId(), newOpId: generateId() });

  db.transaction((tx) => {
    tx.insert(target).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}
