import { calculateTrendSeries, weeklyRateFromSeries, type WeighIn } from './trend';

const MIN_WEIGH_IN_DAYS = 14;
const MIN_FOOD_LOGGED_DAYS_OF_LAST_7 = 5;
const KCAL_PER_KG = 7700;
const MAX_WEEKLY_KCAL_ADJUSTMENT = 150;
/** Window (in trend-series entries) used to estimate "real" maintenance calories — matches the
 * same 14-day minimum the readiness gate requires, so there's only one "how much history" knob. */
const MAINTENANCE_WINDOW_ENTRIES = 14;

export type DailyCalories = { localDate: string; kcal: number };

export type CheckInInput = {
  /** All known weigh-ins (full history) — missing days are fine, `trend.ts` already skips them. */
  weighIns: WeighIn[];
  /** Negative to lose, positive to gain, 0 to maintain (same convention as `bmr.ts#ProfileInput`). */
  plannedRateKgPerWeek: number;
  /** Only days where food WAS actually logged, with that day's total calories — a day with no
   * entry is simply absent from this list, not a zero (PRD §4.4's "logging is too sparse" gate
   * needs to tell "didn't log" apart from "logged zero calories"). */
  dailyCaloriesLogged: DailyCalories[];
  /** Today's local date (YYYY-MM-DD) — passed in rather than read from the clock so this stays a
   * pure, deterministic function. Use `platform/localDate.ts#getLocalDateString()` to produce it. */
  today: string;
};

export type CheckInResult =
  | { ready: false; reason: string }
  | {
      ready: true;
      /** Actual weekly trend change in kg (same sign convention as `plannedRateKgPerWeek` —
       * negative means the trend is falling, i.e. losing weight). */
      trendChangeKgPerWeek: number;
      estimatedMaintenanceKcal: number;
      /**
       * Sign convention: positive = eat MORE, negative = eat LESS.
       * Derived from PRD §4.4 step 3: `(planned − actual) × 7700 ÷ 7`, capped at ±150 kcal/week.
       * Example: planned −0.5 kg/wk but actual −0.2 kg/wk (losing slower than planned) →
       * planned − actual = −0.3 → negative suggestion → eat less to hit the target rate.
       * Example: planned −0.5 kg/wk but actual −0.8 kg/wk (losing faster than planned) →
       * planned − actual = +0.3 → positive suggestion → eat more, the deficit is too aggressive.
       */
      suggestedKcalChange: number;
    };

function lastNCalendarDates(today: string, n: number): string[] {
  const dates: string[] = [];
  const d = new Date(`${today}T00:00:00Z`);
  for (let i = 0; i < n; i++) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return dates;
}

/** Calendar-day span between two "YYYY-MM-DD" strings (UTC-midnight-anchored, same technique as
 * `todaySummary.ts#daysBefore` — safe regardless of the runtime's own timezone since it never
 * touches "now"). */
function daysBetween(earlier: string, later: string): number {
  const a = new Date(`${earlier}T00:00:00Z`).getTime();
  const b = new Date(`${later}T00:00:00Z`).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * PRD §4.4 weekly adaptive check-in. Pure logic — no DB, no network, no system clock reads.
 *
 * Readiness gate (PRD: "If logging is too sparse, the check-in says so instead of guessing"):
 * at least 14 distinct days of weigh-ins AND food logged on at least 5 of the last 7 calendar
 * days (relative to `input.today`).
 */
export function evaluateWeeklyCheckIn(input: CheckInInput): CheckInResult {
  const { weighIns, plannedRateKgPerWeek, dailyCaloriesLogged, today } = input;

  const distinctWeighInDays = new Set(weighIns.map((w) => w.localDate)).size;
  if (distinctWeighInDays < MIN_WEIGH_IN_DAYS) {
    return {
      ready: false,
      reason: `Needs at least ${MIN_WEIGH_IN_DAYS} days of weigh-ins before a reliable check-in (have ${distinctWeighInDays}).`,
    };
  }

  const last7Days = new Set(lastNCalendarDates(today, 7));
  const loggedInLast7 = dailyCaloriesLogged.filter((d) => last7Days.has(d.localDate)).length;
  if (loggedInLast7 < MIN_FOOD_LOGGED_DAYS_OF_LAST_7) {
    return {
      ready: false,
      reason: `Needs food logged on at least ${MIN_FOOD_LOGGED_DAYS_OF_LAST_7} of the last 7 days before a reliable check-in (have ${loggedInLast7}).`,
    };
  }

  const trendSeries = calculateTrendSeries(weighIns);
  const actualWeeklyRateKg = weeklyRateFromSeries(trendSeries) ?? 0;

  const window = trendSeries.slice(-MAINTENANCE_WINDOW_ENTRIES);
  const windowDates = new Set(window.map((t) => t.localDate));
  const loggedInWindow = dailyCaloriesLogged.filter((d) => windowDates.has(d.localDate));
  const avgDailyIntake =
    loggedInWindow.length > 0 ? loggedInWindow.reduce((sum, d) => sum + d.kcal, 0) / loggedInWindow.length : 0;

  const trendChangeOverWindowKg = window[window.length - 1].trend - window[0].trend;
  const windowDays = Math.max(1, daysBetween(window[0].localDate, window[window.length - 1].localDate));
  const estimatedMaintenanceKcal = avgDailyIntake - (trendChangeOverWindowKg * KCAL_PER_KG) / windowDays;

  const rawSuggestion = ((plannedRateKgPerWeek - actualWeeklyRateKg) * KCAL_PER_KG) / 7;
  const suggestedKcalChange = Math.max(
    -MAX_WEEKLY_KCAL_ADJUSTMENT,
    Math.min(MAX_WEEKLY_KCAL_ADJUSTMENT, rawSuggestion),
  );

  return {
    ready: true,
    trendChangeKgPerWeek: actualWeeklyRateKg,
    estimatedMaintenanceKcal,
    suggestedKcalChange,
  };
}
