import { eq } from 'drizzle-orm';

import { getDb } from '../db/client';
import { outbox, scheduleEntry, type ScheduleEntryRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildSetScheduleDayChange } from './scheduleEntryLogic';

/** Index 0 = Sunday .. 6 = Saturday, matching `Date.prototype.getDay()`. */
export function getSchedule(): ScheduleEntryRow[] {
  const db = getDb();
  return db.select().from(scheduleEntry).all() as ScheduleEntryRow[];
}

export function setScheduleDay(weekday: number, templateId: string | null): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.transaction((tx) => {
    const existing = (tx.select().from(scheduleEntry).where(eq(scheduleEntry.weekday, weekday)).all()[0] ??
      null) as ScheduleEntryRow | null;

    const { entry, outboxRow } = buildSetScheduleDayChange({
      existing,
      weekday,
      templateId,
      now,
      newId: generateId(),
      newOpId: generateId(),
    });

    if (existing) {
      tx.update(scheduleEntry).set(entry).where(eq(scheduleEntry.id, entry.id)).run();
    } else {
      tx.insert(scheduleEntry).values(entry).run();
    }
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}
