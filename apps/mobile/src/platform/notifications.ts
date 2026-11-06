export type RestTimerNotification = {
  secondsRemaining: number;
  exerciseName: string;
};

export function scheduleRestTimerNotification(_params: RestTimerNotification): Promise<string> {
  throw new Error('Not implemented: wired up in the Workouts phase (PRD §3.3, §5)');
}

export function cancelNotification(_notificationId: string): Promise<void> {
  throw new Error('Not implemented: wired up in the Workouts phase (PRD §3.3, §5)');
}
