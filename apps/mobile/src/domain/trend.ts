const SMOOTHING_FACTOR = 0.1;

export type WeighIn = { localDate: string; weightKg: number };

export function nextTrendWeight(previousTrend: number, todayWeightKg: number): number {
  return previousTrend + SMOOTHING_FACTOR * (todayWeightKg - previousTrend);
}

/** Missing days are skipped, not filled with zero — the caller passes only logged weigh-ins. */
export function calculateTrendSeries(weighIns: WeighIn[]): { localDate: string; trend: number }[] {
  if (weighIns.length === 0) return [];

  const sorted = [...weighIns].sort((a, b) => a.localDate.localeCompare(b.localDate));
  const series: { localDate: string; trend: number }[] = [
    { localDate: sorted[0].localDate, trend: sorted[0].weightKg },
  ];

  for (let i = 1; i < sorted.length; i++) {
    const previousTrend = series[i - 1].trend;
    series.push({
      localDate: sorted[i].localDate,
      trend: nextTrendWeight(previousTrend, sorted[i].weightKg),
    });
  }

  return series;
}

export function weeklyRateFromSeries(
  series: { localDate: string; trend: number }[],
): number | null {
  if (series.length < 2) return null;
  const latest = series[series.length - 1];
  const sevenBack = series.find((_, idx) => idx === series.length - 1 - 7) ?? series[0];
  return latest.trend - sevenBack.trend;
}
