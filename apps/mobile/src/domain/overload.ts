export type RepRange = { repMin: number; repMax: number };

export type OverloadSuggestion = 'increase-weight' | 'hold' | 'reduce-weight' | 'none';

/**
 * PRD §4.5 double progression. `lastTwoSessions` is the completed-working-set rep counts
 * (warmups excluded) for this exercise, most recent session first — pass at most 2 sessions.
 * Needs both sessions to agree before suggesting a change; a single good/bad session just holds.
 */
export function suggestOverload(repRange: RepRange, lastTwoSessions: number[][]): OverloadSuggestion {
  if (lastTwoSessions.length < 2) return 'none';

  const [mostRecent, before] = lastTwoSessions;
  if (mostRecent.length === 0 || before.length === 0) return 'none';

  const allAtTop = (session: number[]) => session.every((reps) => reps >= repRange.repMax);
  const anyBelowRange = (session: number[]) => session.some((reps) => reps < repRange.repMin);

  if (allAtTop(mostRecent) && allAtTop(before)) return 'increase-weight';
  if (anyBelowRange(mostRecent) && anyBelowRange(before)) return 'reduce-weight';
  return 'hold';
}
