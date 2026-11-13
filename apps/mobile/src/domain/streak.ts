export type StreakDayStatus = 'completed' | 'rest' | 'missed' | 'upcoming';

export type WorkoutStreakSummary = {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  completedDates: string[];
  lastSevenDays: { localDate: string; status: StreakDayStatus }[];
};

export type AchievementId =
  | 'first-workout'
  | 'three-day-streak'
  | 'seven-day-streak'
  | 'fourteen-day-streak'
  | 'thirty-day-streak'
  | 'hundred-workouts';

export type AchievementDefinition = {
  id: AchievementId;
  title: string;
  description: string;
  target: number;
  metric: 'workouts' | 'streak';
};

export type AchievementProgress = AchievementDefinition & {
  value: number;
  unlocked: boolean;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first-workout', title: 'First rep', description: 'Complete your first workout', target: 1, metric: 'workouts' },
  { id: 'three-day-streak', title: 'Three strong', description: 'Build a 3-day streak', target: 3, metric: 'streak' },
  { id: 'seven-day-streak', title: 'Full week', description: 'Build a 7-day streak', target: 7, metric: 'streak' },
  { id: 'fourteen-day-streak', title: 'Locked in', description: 'Build a 14-day streak', target: 14, metric: 'streak' },
  { id: 'thirty-day-streak', title: 'Unstoppable', description: 'Build a 30-day streak', target: 30, metric: 'streak' },
  { id: 'hundred-workouts', title: 'Century club', description: 'Complete 100 workouts', target: 100, metric: 'workouts' },
];

function shiftDate(localDate: string, days: number): string {
  const date = new Date(`${localDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekdayOf(localDate: string): number {
  return new Date(`${localDate}T00:00:00Z`).getUTCDay();
}

function isRestDay(localDate: string): boolean {
  return weekdayOf(localDate) === 0;
}

function uniqueSortedDates(dates: string[]): string[] {
  return [...new Set(dates)].sort();
}

function currentStreak(completed: Set<string>, today: string): number {
  // Today is still in progress. When it has not been completed yet, preserve yesterday's streak;
  // a missed earlier training day still breaks the streak normally.
  let cursor = completed.has(today) || isRestDay(today) ? today : shiftDate(today, -1);
  let count = 0;

  while (true) {
    if (isRestDay(cursor)) {
      cursor = shiftDate(cursor, -1);
      continue;
    }
    if (!completed.has(cursor)) return count;
    count += 1;
    cursor = shiftDate(cursor, -1);
  }
}

function longestStreak(completed: Set<string>, dates: string[], today: string): number {
  if (dates.length === 0) return 0;

  let cursor = dates[0];
  let count = 0;
  let longest = 0;
  while (cursor <= today) {
    if (isRestDay(cursor)) {
      cursor = shiftDate(cursor, 1);
      continue;
    }
    if (completed.has(cursor)) {
      count += 1;
      longest = Math.max(longest, count);
    } else {
      count = 0;
    }
    cursor = shiftDate(cursor, 1);
  }
  return longest;
}

export function calculateWorkoutStreak(completedDates: string[], today: string): WorkoutStreakSummary {
  const dates = uniqueSortedDates(completedDates);
  const completed = new Set(dates);
  const lastSevenDays: { localDate: string; status: StreakDayStatus }[] = Array.from({ length: 7 }, (_, index) => {
    const localDate = shiftDate(today, index - 6);
    const status: StreakDayStatus = isRestDay(localDate)
      ? 'rest'
      : completed.has(localDate)
        ? 'completed'
        : localDate < today
          ? 'missed'
          : 'upcoming';
    return { localDate, status };
  });

  return {
    currentStreak: currentStreak(completed, today),
    longestStreak: longestStreak(completed, dates, today),
    totalWorkouts: completedDates.length,
    completedDates: dates,
    lastSevenDays,
  };
}

export function getAchievementProgress(summary: WorkoutStreakSummary): AchievementProgress[] {
  return ACHIEVEMENTS.map((achievement) => {
    const value = achievement.metric === 'workouts' ? summary.totalWorkouts : summary.longestStreak;
    return { ...achievement, value: Math.min(value, achievement.target), unlocked: value >= achievement.target };
  });
}
