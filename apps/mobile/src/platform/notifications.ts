import * as Notifications from 'expo-notifications';

import {
  getSettings,
  saveScheduledNotificationIds,
} from '../data/repositories/notificationSettingsRepository';
import { totalForDate, waterTargetMl } from '../data/repositories/waterEntryRepository';
import { getLocalDateString } from './localDate';

export type RestTimerNotification = {
  secondsRemaining: number;
  exerciseName: string;
};

const WATER_REMINDER_INTERVAL_HOURS = 2;

let permissionRequested = false;

async function ensurePermission(): Promise<void> {
  if (permissionRequested) return;
  permissionRequested = true;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // Best-effort — a denied/unavailable permission just means the notification won't show;
    // the in-app rest timer countdown still works regardless.
  }
}

/** Schedules a notification for when the rest timer ends (useful once the app is backgrounded —
 * the in-app countdown banner covers the foreground case). Returns the notification id. */
export async function scheduleRestTimerNotification(params: RestTimerNotification): Promise<string> {
  await ensurePermission();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest over',
      body: `Time for your next set of ${params.exerciseName}.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(params.secondsRemaining)),
    },
  });
}

export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Recomputes the water-reminder schedule from scratch: cancels whatever this feature previously
 * scheduled, then (if enabled and today's water target isn't already met) schedules one
 * notification per 2-hour slot from now (or wake hour, whichever is later) up to sleep hour today.
 * Called on app start, on app foreground, and after every `logWater` (PRD-adjacent water-reminder
 * feature — see `waterEntryRepository.logWater` and `app/(tabs)/_layout.tsx`).
 */
export async function rescheduleWaterReminders(): Promise<void> {
  const settings = getSettings();

  for (const id of settings.scheduledNotificationIds) {
    try {
      await cancelNotification(id);
    } catch {
      // Best-effort — matches this file's existing error-swallowing style: a notification that
      // already fired/was cancelled elsewhere just means there's nothing left to cancel.
    }
  }

  if (!settings.enabled) {
    saveScheduledNotificationIds([]);
    return;
  }

  const today = getLocalDateString();
  if (totalForDate(today) >= waterTargetMl()) {
    // Today's target is already met — no reminders needed for the rest of the day.
    saveScheduledNotificationIds([]);
    return;
  }

  await ensurePermission();

  const now = new Date();
  const wakeToday = new Date(now);
  wakeToday.setHours(settings.wakeHour, 0, 0, 0);
  const sleepToday = new Date(now);
  sleepToday.setHours(settings.sleepHour, 0, 0, 0);

  const newIds: string[] = [];
  let slot = now > wakeToday ? new Date(now) : new Date(wakeToday);

  while (slot.getTime() <= sleepToday.getTime()) {
    if (slot.getTime() > now.getTime()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Drink water',
          body: 'Stay on track with your water goal.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(slot),
        },
      });
      newIds.push(id);
    }
    slot = new Date(slot.getTime() + WATER_REMINDER_INTERVAL_HOURS * 60 * 60 * 1000);
  }

  saveScheduledNotificationIds(newIds);
}
