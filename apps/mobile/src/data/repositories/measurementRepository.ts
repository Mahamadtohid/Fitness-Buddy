import { and, desc, eq, isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import { measurement, outbox, type MeasurementRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { buildLogMeasurementChange, type MeasurementType } from './measurementLogic';

export function logMeasurement(localDate: string, type: MeasurementType, valueCm: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  const { entry, outboxRow } = buildLogMeasurementChange({
    localDate,
    type,
    valueCm,
    now,
    newId: generateId(),
    newOpId: generateId(),
  });

  db.transaction((tx) => {
    tx.insert(measurement).values(entry).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();
}

export function listByType(type: MeasurementType): MeasurementRow[] {
  const db = getDb();
  return db
    .select()
    .from(measurement)
    .where(and(eq(measurement.type, type), isNull(measurement.deletedAt)))
    .orderBy(desc(measurement.localDate))
    .all() as MeasurementRow[];
}
