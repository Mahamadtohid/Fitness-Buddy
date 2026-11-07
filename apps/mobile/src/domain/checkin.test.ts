import { calculateTrendSeries, weeklyRateFromSeries } from './trend';
import { evaluateWeeklyCheckIn, type DailyCalories } from './checkin';
import type { WeighIn } from './trend';

/** Builds `n` consecutive daily weigh-ins ending at `today`, starting at `startWeightKg` and
 * changing by `dailyDeltaKg` each day — lets tests describe a trend in plain English ("losing
 * 0.1kg/day") instead of hand-picking numbers. */
function buildWeighIns(today: string, n: number, startWeightKg: number, dailyDeltaKg: number): WeighIn[] {
  const result: WeighIn[] = [];
  const base = new Date(`${today}T00:00:00Z`);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - (n - 1 - i));
    result.push({ localDate: d.toISOString().slice(0, 10), weightKg: startWeightKg + dailyDeltaKg * i });
  }
  return result;
}

function lastNDates(today: string, n: number): string[] {
  const dates: string[] = [];
  const d = new Date(`${today}T00:00:00Z`);
  for (let i = 0; i < n; i++) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return dates;
}

const TODAY = '2026-11-07';

describe('evaluateWeeklyCheckIn', () => {
  it('is not ready with fewer than 14 days of weigh-ins', () => {
    const weighIns = buildWeighIns(TODAY, 10, 80, -0.05);
    const dailyCaloriesLogged: DailyCalories[] = lastNDates(TODAY, 7).map((localDate) => ({ localDate, kcal: 2000 }));

    const result = evaluateWeeklyCheckIn({ weighIns, plannedRateKgPerWeek: -0.5, dailyCaloriesLogged, today: TODAY });
    expect(result.ready).toBe(false);
  });

  it('is not ready when food was logged on fewer than 5 of the last 7 days', () => {
    const weighIns = buildWeighIns(TODAY, 20, 80, -0.05);
    const dailyCaloriesLogged: DailyCalories[] = lastNDates(TODAY, 7)
      .slice(0, 3)
      .map((localDate) => ({ localDate, kcal: 2000 }));

    const result = evaluateWeeklyCheckIn({ weighIns, plannedRateKgPerWeek: -0.5, dailyCaloriesLogged, today: TODAY });
    expect(result.ready).toBe(false);
  });

  it('suggests close to zero when actual rate already matches the plan', () => {
    // A long, steady ramp so the EMA trend is well past its initial transient by the time
    // `weeklyRateFromSeries` samples it 7 entries back from the end (EMA converges toward the
    // true underlying rate exponentially — a short series still carries meaningful residual lag).
    const weighIns = buildWeighIns(TODAY, 40, 80, -0.5 / 7);
    const dailyCaloriesLogged: DailyCalories[] = lastNDates(TODAY, 7).map((localDate) => ({ localDate, kcal: 2000 }));

    const result = evaluateWeeklyCheckIn({ weighIns, plannedRateKgPerWeek: -0.5, dailyCaloriesLogged, today: TODAY });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(Math.abs(result.suggestedKcalChange)).toBeLessThan(15);
    }
  });

  it('suggests eating LESS when losing slower than planned (negative suggestion)', () => {
    const weighIns = buildWeighIns(TODAY, 21, 80, -0.1 / 7); // actual ~-0.1 kg/wk, planned -0.5 kg/wk
    const dailyCaloriesLogged: DailyCalories[] = lastNDates(TODAY, 7).map((localDate) => ({ localDate, kcal: 2200 }));

    const result = evaluateWeeklyCheckIn({ weighIns, plannedRateKgPerWeek: -0.5, dailyCaloriesLogged, today: TODAY });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.suggestedKcalChange).toBeLessThan(0);
    }
  });

  it('suggests eating MORE when losing faster than planned (positive suggestion)', () => {
    const weighIns = buildWeighIns(TODAY, 21, 80, -1.0 / 7); // actual ~-1.0 kg/wk, planned -0.5 kg/wk
    const dailyCaloriesLogged: DailyCalories[] = lastNDates(TODAY, 7).map((localDate) => ({ localDate, kcal: 1500 }));

    const result = evaluateWeeklyCheckIn({ weighIns, plannedRateKgPerWeek: -0.5, dailyCaloriesLogged, today: TODAY });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.suggestedKcalChange).toBeGreaterThan(0);
    }
  });

  it('clamps an extreme mismatch to exactly the +/-150 kcal cap', () => {
    const weighIns = buildWeighIns(TODAY, 21, 80, 0); // flat — actual rate ~0 kg/wk
    const dailyCaloriesLogged: DailyCalories[] = lastNDates(TODAY, 7).map((localDate) => ({ localDate, kcal: 2000 }));

    // Planned loss is extreme (-5 kg/wk) relative to a flat actual trend — the raw suggestion
    // (planned - actual) * 7700 / 7 would be roughly -5500 kcal/day without the cap.
    const result = evaluateWeeklyCheckIn({ weighIns, plannedRateKgPerWeek: -5, dailyCaloriesLogged, today: TODAY });
    expect(result.ready).toBe(true);
    if (result.ready) {
      expect(result.suggestedKcalChange).toBe(-150);
    }
  });

  it('derives estimatedMaintenanceKcal from the same trend math as trend.ts (sanity cross-check)', () => {
    const weighIns = buildWeighIns(TODAY, 21, 80, -0.3 / 7);
    const dailyCaloriesLogged: DailyCalories[] = lastNDates(TODAY, 21).map((localDate) => ({ localDate, kcal: 2100 }));

    const result = evaluateWeeklyCheckIn({ weighIns, plannedRateKgPerWeek: -0.5, dailyCaloriesLogged, today: TODAY });
    expect(result.ready).toBe(true);
    if (result.ready) {
      // Maintenance should be higher than the logged intake when the trend is still falling
      // (i.e. there's a real deficit) — 2100 kcal/day produced a loss, so maintenance > 2100.
      expect(result.estimatedMaintenanceKcal).toBeGreaterThan(2100);

      // Cross-check against independently-computed trend series, not a hardcoded number.
      const series = calculateTrendSeries(weighIns);
      const actualRate = weeklyRateFromSeries(series);
      expect(result.trendChangeKgPerWeek).toBeCloseTo(actualRate ?? 0);
    }
  });
});
