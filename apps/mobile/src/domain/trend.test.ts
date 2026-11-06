import { calculateTrendSeries, nextTrendWeight, weeklyRateFromSeries } from './trend';

describe('nextTrendWeight', () => {
  it('moves the trend 10% toward today’s weight', () => {
    expect(nextTrendWeight(80, 81)).toBeCloseTo(80.1);
    expect(nextTrendWeight(80, 79)).toBeCloseTo(79.9);
  });
});

describe('calculateTrendSeries', () => {
  it('seeds the trend from the first weigh-in and smooths afterwards', () => {
    const series = calculateTrendSeries([
      { localDate: '2026-01-01', weightKg: 80 },
      { localDate: '2026-01-02', weightKg: 81 },
      { localDate: '2026-01-03', weightKg: 80.5 },
    ]);

    expect(series[0].trend).toBe(80);
    expect(series[1].trend).toBeCloseTo(80.1);
    expect(series[2].trend).toBeCloseTo(80.1 + 0.1 * (80.5 - 80.1));
  });

  it('skips missing days rather than treating them as zero', () => {
    const series = calculateTrendSeries([
      { localDate: '2026-01-01', weightKg: 80 },
      { localDate: '2026-01-05', weightKg: 79 },
    ]);
    expect(series).toHaveLength(2);
    expect(series[1].trend).toBeCloseTo(80 + 0.1 * (79 - 80));
  });
});

describe('weeklyRateFromSeries', () => {
  it('returns null when fewer than 2 points exist', () => {
    expect(weeklyRateFromSeries([])).toBeNull();
    expect(weeklyRateFromSeries([{ localDate: '2026-01-01', trend: 80 }])).toBeNull();
  });

  it('compares the latest trend to 7 points back', () => {
    const series = Array.from({ length: 8 }, (_, i) => ({
      localDate: `2026-01-${String(i + 1).padStart(2, '0')}`,
      trend: 80 - i * 0.1,
    }));
    expect(weeklyRateFromSeries(series)).toBeCloseTo(series[7].trend - series[0].trend);
  });
});
