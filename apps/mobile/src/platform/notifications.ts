import * as Notifications from 'expo-notifications';

export type RestTimerNotification = {
  secondsRemaining: number;
  exerciseName: string;
};

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
