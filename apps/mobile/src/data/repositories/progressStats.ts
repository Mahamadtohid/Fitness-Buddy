import { daysBefore, nutritionEatenForDate } from './todaySummary';
import { listForDate } from './foodEntryRepository';
import { hasSessionForDate, sessionCountForDate } from './workoutSessionRepository';
import { getLocalDateString } from '../../platform/localDate';

export type WeeklyProgressStats = {
  workoutsThisWeek: number;
  daysLoggedThisWeek: number;
  avgKcal: number;
  avgProteinG: number;
  /** Oldest to newest, 7 entries ending today — feeds the Nutrition trends sparklines. */
  dailyKcalSeries: number[];
  dailyProteinSeries: number[];
  /** This week's daily average minus the prior week's — the "▼134 kcal" style delta in the
   * reference UI mockup. Negative means this week's average is lower than last week's. */
  kcalDeltaVsPriorWeek: number;
  proteinDeltaVsPriorWeek: number;
};

function averageOf(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** The last 7 calendar days' (localDate, kcal, proteinG), oldest first — reuses
 * `todaySummary.ts`'s nutrition-resolution logic rather than re-deriving it. */
function lastSevenDaysNutrition(today: string): { kcal: number; proteinG: number }[] {
  return Array.from({ length: 7 }, (_, i) => nutritionEatenForDate(daysBefore(today, 6 - i)));
}

/**
 * Progress tab's "This week" stat row and "Nutrition trends" sparklines (reference UI mockup) —
 * read-only aggregation over existing data, not a new entity. Workouts-this-week counts actual
 * sessions (PRD allows more than one a day), not just trained/untrained days.
 */
export function getWeeklyProgressStats(): WeeklyProgressStats {
  const today = getLocalDateString();
  const last7Dates = Array.from({ length: 7 }, (_, i) => daysBefore(today, 6 - i));
  const prior7Dates = Array.from({ length: 7 }, (_, i) => daysBefore(today, 13 - i));

  const thisWeekNutrition = lastSevenDaysNutrition(today);
  const priorWeekNutrition = prior7Dates.map((d) => nutritionEatenForDate(d));

  const workoutsThisWeek = last7Dates.reduce((sum, d) => sum + sessionCountForDate(d), 0);
  const daysLoggedThisWeek = last7Dates.filter((d) => listForDate(d).length > 0).length;

  const avgKcal = averageOf(thisWeekNutrition.map((n) => n.kcal));
  const avgProteinG = averageOf(thisWeekNutrition.map((n) => n.proteinG));
  const priorAvgKcal = averageOf(priorWeekNutrition.map((n) => n.kcal));
  const priorAvgProteinG = averageOf(priorWeekNutrition.map((n) => n.proteinG));

  return {
    workoutsThisWeek,
    daysLoggedThisWeek,
    avgKcal,
    avgProteinG,
    dailyKcalSeries: thisWeekNutrition.map((n) => n.kcal),
    dailyProteinSeries: thisWeekNutrition.map((n) => n.proteinG),
    kcalDeltaVsPriorWeek: avgKcal - priorAvgKcal,
    proteinDeltaVsPriorWeek: avgProteinG - priorAvgProteinG,
  };
}

// Re-export so screens needing "is there a session today" styled per-day training checks for a
// week strip don't need to import workoutSessionRepository directly just for this one helper.
export { hasSessionForDate };
