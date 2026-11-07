/** Epley-formula estimated one-rep max. */
export function estimatedOneRepMax(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

/**
 * Whether `history[index]`'s estimated 1RM is a personal record — strictly greater than the max
 * estimated 1RM of every entry before it in `history`.
 *
 * Convention: the very first entry in `history` IS treated as a PR — there's nothing earlier to
 * beat, but it's the first set of its kind on record, so it counts as one rather than needing a
 * second set before anything can ever be a PR.
 */
export function isPersonalRecord(history: { weightKg: number; reps: number }[], index: number): boolean {
  if (index < 0 || index >= history.length) return false;
  if (index === 0) return true;

  const current = estimatedOneRepMax(history[index].weightKg, history[index].reps);
  let bestBefore = -Infinity;
  for (let i = 0; i < index; i++) {
    const e1rm = estimatedOneRepMax(history[i].weightKg, history[i].reps);
    if (e1rm > bestBefore) bestBefore = e1rm;
  }
  return current > bestBefore;
}
