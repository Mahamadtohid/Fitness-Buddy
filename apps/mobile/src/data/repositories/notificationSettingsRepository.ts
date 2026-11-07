import { eq } from 'drizzle-orm';

import { getDb } from '../db/client';
import { notificationSettings, type NotificationSettingsRow } from '../db/schema';

/**
 * LOCAL ONLY, singleton (mirrors `schema.ts`'s doc comment on `notificationSettings` — same
 * no-sync-columns precedent as `photoRepository.ts`, so unlike the synced repositories there is no
 * outbox enqueue and no `notifyLocalWrite()` here at all).
 */
const SINGLETON_ID = 'singleton';

export type NotificationSettings = {
  enabled: boolean;
  wakeHour: number;
  sleepHour: number;
  scheduledNotificationIds: string[];
};

function toSettings(row: NotificationSettingsRow): NotificationSettings {
  let scheduledNotificationIds: string[] = [];
  try {
    const parsed = JSON.parse(row.scheduledNotificationIds);
    if (Array.isArray(parsed)) scheduledNotificationIds = parsed as string[];
  } catch {
    // Malformed JSON (shouldn't happen — only this repository ever writes this column) — treat as
    // no pending notifications rather than throwing.
  }
  return {
    enabled: row.enabled === 1,
    wakeHour: row.wakeHour,
    sleepHour: row.sleepHour,
    scheduledNotificationIds,
  };
}

/** Reads the singleton settings row, creating a default one (disabled, 7am-10pm, no pending
 * notifications) if none exists yet. */
export function getSettings(): NotificationSettings {
  const db = getDb();
  const existing = (
    db.select().from(notificationSettings).limit(1).all()[0] ?? null
  ) as NotificationSettingsRow | null;

  if (existing) return toSettings(existing);

  const defaults: NotificationSettingsRow = {
    id: SINGLETON_ID,
    enabled: 0,
    wakeHour: 7,
    sleepHour: 22,
    scheduledNotificationIds: '[]',
  };
  db.insert(notificationSettings).values(defaults).run();
  return toSettings(defaults);
}

/** Upserts the singleton row's enabled/wakeHour/sleepHour, preserving whatever
 * `scheduledNotificationIds` is already stored. */
export function saveSettings(input: { enabled: boolean; wakeHour: number; sleepHour: number }): void {
  const db = getDb();
  const existing = (
    db.select().from(notificationSettings).limit(1).all()[0] ?? null
  ) as NotificationSettingsRow | null;

  const entry: NotificationSettingsRow = {
    id: SINGLETON_ID,
    enabled: input.enabled ? 1 : 0,
    wakeHour: input.wakeHour,
    sleepHour: input.sleepHour,
    scheduledNotificationIds: existing?.scheduledNotificationIds ?? '[]',
  };

  if (existing) {
    db.update(notificationSettings).set(entry).where(eq(notificationSettings.id, existing.id)).run();
  } else {
    db.insert(notificationSettings).values(entry).run();
  }
}

/** Updates just the pending-notification-ids column (called after a reschedule). */
export function saveScheduledNotificationIds(ids: string[]): void {
  const db = getDb();
  const existing = (
    db.select().from(notificationSettings).limit(1).all()[0] ?? null
  ) as NotificationSettingsRow | null;

  const scheduledNotificationIds = JSON.stringify(ids);

  if (existing) {
    db.update(notificationSettings)
      .set({ scheduledNotificationIds })
      .where(eq(notificationSettings.id, existing.id))
      .run();
  } else {
    db.insert(notificationSettings)
      .values({
        id: SINGLETON_ID,
        enabled: 0,
        wakeHour: 7,
        sleepHour: 22,
        scheduledNotificationIds,
      })
      .run();
  }
}
