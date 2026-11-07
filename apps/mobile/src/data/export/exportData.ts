import { isNull } from 'drizzle-orm';

import { getDb } from '../db/client';
import {
  checkIn,
  exercise,
  food,
  foodEntry,
  foodOverride,
  measurement,
  profile,
  savedMeal,
  scheduleEntry,
  setEntry,
  target,
  waterEntry,
  weightEntry,
  workoutSession,
  workoutTemplate,
} from '../db/schema';

/**
 * One fetcher per exportable/importable table, each independently type-checked against its own
 * drizzle table (avoids fighting the type system with a single generic function over
 * structurally-different tables). `photo` is deliberately NOT here — it's files on disk, not
 * just rows, and is out of scope for a JSON/CSV data export (see `PHOTO_EXPORT_NOTE`).
 *
 * Only non-deleted rows: an export represents current state to restore, not sync-plumbing
 * tombstone history.
 */
const TABLE_FETCHERS: Record<string, () => Record<string, unknown>[]> = {
  weightEntry: () => getDb().select().from(weightEntry).where(isNull(weightEntry.deletedAt)).all(),
  exercise: () => getDb().select().from(exercise).where(isNull(exercise.deletedAt)).all(),
  workoutTemplate: () => getDb().select().from(workoutTemplate).where(isNull(workoutTemplate.deletedAt)).all(),
  scheduleEntry: () => getDb().select().from(scheduleEntry).where(isNull(scheduleEntry.deletedAt)).all(),
  workoutSession: () => getDb().select().from(workoutSession).where(isNull(workoutSession.deletedAt)).all(),
  setEntry: () => getDb().select().from(setEntry).where(isNull(setEntry.deletedAt)).all(),
  profile: () => getDb().select().from(profile).where(isNull(profile.deletedAt)).all(),
  target: () => getDb().select().from(target).where(isNull(target.deletedAt)).all(),
  food: () => getDb().select().from(food).where(isNull(food.deletedAt)).all(),
  foodOverride: () => getDb().select().from(foodOverride).where(isNull(foodOverride.deletedAt)).all(),
  savedMeal: () => getDb().select().from(savedMeal).where(isNull(savedMeal.deletedAt)).all(),
  foodEntry: () => getDb().select().from(foodEntry).where(isNull(foodEntry.deletedAt)).all(),
  waterEntry: () => getDb().select().from(waterEntry).where(isNull(waterEntry.deletedAt)).all(),
  measurement: () => getDb().select().from(measurement).where(isNull(measurement.deletedAt)).all(),
  checkIn: () => getDb().select().from(checkIn).where(isNull(checkIn.deletedAt)).all(),
};

/** PRD §8.3's `photo` table is local-only and stores file paths, not portable data — a JSON/CSV
 * export of the row alone (without the image bytes) wouldn't be a usable backup, so photos are
 * excluded entirely. Surfaced here so callers (and the Settings screen) can tell the user this
 * explicitly rather than silently omitting it. */
export const PHOTO_EXPORT_NOTE =
  'Progress photos are stored only on this device and are not included in this export.';

export function availableExportTableNames(): string[] {
  return Object.keys(TABLE_FETCHERS);
}

export function exportToJson(): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {};
  for (const [name, fetch] of Object.entries(TABLE_FETCHERS)) {
    result[name] = fetch();
  }
  return result;
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportTableToCsv(tableName: string): string {
  const fetch = TABLE_FETCHERS[tableName];
  if (!fetch) throw new Error(`Unknown table for CSV export: ${tableName}`);

  const rows = fetch();
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => toCsvValue(row[header])).join(','));
  }
  return lines.join('\n');
}
