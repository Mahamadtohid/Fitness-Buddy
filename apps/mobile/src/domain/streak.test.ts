import { calculateWorkoutStreak, getAchievementProgress } from './streak';

describe('calculateWorkoutStreak', () => {
  it('skips Sunday without breaking a streak', () => {
    const result = calculateWorkoutStreak(
      ['2026-11-06', '2026-11-07', '2026-11-09'],
      '2026-11-09',
    );

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.lastSevenDays.find((day) => day.localDate === '2026-11-08')?.status).toBe('rest');
  });

  it('breaks on a missed non-rest day', () => {
    const result = calculateWorkoutStreak(
      ['2026-11-02', '2026-11-04'],
      '2026-11-04',
    );

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('keeps yesterday visible while today is still in progress', () => {
    const result = calculateWorkoutStreak(['2026-11-07'], '2026-11-09');

    expect(result.currentStreak).toBe(1);
  });

  it('counts multiple sessions on one date as multiple workouts but one streak day', () => {
    const result = calculateWorkoutStreak(
      ['2026-11-09', '2026-11-09'],
      '2026-11-09',
    );

    expect(result.totalWorkouts).toBe(2);
    expect(result.currentStreak).toBe(1);
  });
});

describe('getAchievementProgress', () => {
  it('unlocks history-based badges from the longest streak and total workouts', () => {
    const summary = calculateWorkoutStreak(
      ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-09'],
      '2026-11-09',
    );
    const progress = getAchievementProgress(summary);

    expect(progress.find((badge) => badge.id === 'first-workout')?.unlocked).toBe(true);
    expect(progress.find((badge) => badge.id === 'seven-day-streak')?.unlocked).toBe(true);
    expect(progress.find((badge) => badge.id === 'hundred-workouts')?.unlocked).toBe(false);
  });
});
