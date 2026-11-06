import { getDb } from '../db/client';
import { outbox, setEntry } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildLogSetChange } from './setEntryLogic';

export function logSet(
  sessionId: string,
  exerciseId: string,
  setNo: number,
  weightKg: number,
  reps: number,
  opts: { rpe?: number | null; isWarmup?: boolean } = {},
): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildLogSetChange({
    sessionId,
    exerciseId,
    setNo,
    weightKg,
    reps,
    rpe: opts.rpe,
    isWarmup: opts.isWarmup,
    now,
    newId: generateId(),
    newOpId: generateId(),
  });

  db.transaction((tx) => {
    tx.insert(setEntry).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}
