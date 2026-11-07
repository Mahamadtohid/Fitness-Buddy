import { eq } from 'drizzle-orm';

import { getDb } from '../db/client';
import { checkIn, outbox, type CheckInRow } from '../db/schema';
import { notifyLocalWrite } from '../sync/writeHook';
import { generateId } from '../../platform/uuid';
import { getLocalDateString } from '../../platform/localDate';
import { evaluateWeeklyCheckIn, type DailyCalories } from '../../domain/checkin';
import { listWeightEntries } from './weightEntryRepository';
import { listForDate } from './foodEntryRepository';
import { resolvedNutritionFor } from './foodRepository';
import { getProfile } from './profileRepository';
import { latestTargets, createTargets } from './targetsRepository';
import { buildGenerateCheckInChange, buildRecordDecisionChange } from './checkInLogic';

/**
 * A generated-but-undecided check-in is stored locally with `decision:'pending'` and
 * deliberately NOT enqueued to the outbox (see `generateCheckIn`) — only `recordDecision`'s first
 * call actually pushes it, under the entity contract's real `'accepted'|'edited'|'skipped'`
 * values. This keeps the server-side sync contract exactly as specified (no extra state invented
 * server-side) and avoids syncing a half-finished local draft before the user has decided
 * anything. It also means `check_in` inherits the same already-known cross-device id
 * reconciliation gap as `schedule`/`food_override`/`profile` (two devices independently deciding
 * the same week's check-in before ever syncing could each end up with a differently-id'd local
 * row for the same `weekStart`) — not a new issue, not addressed here, consistent with those.
 */

const WINDOW_DAYS_FOR_CALORIE_HISTORY = 21;

/** This local-Monday's date as YYYY-MM-DD, via local `Date` arithmetic (NOT UTC — consistent
 * with the project-wide local-date timezone fix in `platform/localDate.ts`). */
export function currentWeekWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  return getLocalDateString(monday);
}

export function currentWeekCheckIn(): CheckInRow | null {
  const db = getDb();
  const weekStart = currentWeekWeekStart();
  return (db.select().from(checkIn).where(eq(checkIn.weekStart, weekStart)).all()[0] ?? null) as CheckInRow | null;
}

/** Each day's total calories, resolving catalog/custom food + any override the same way
 * `todaySummary.ts#nutritionEatenForDate` does — days with no logged entry are simply absent
 * (not zero), matching `checkin.ts`'s "logged" vs "not logged" distinction. */
function dailyCaloriesForWindow(days: number): DailyCalories[] {
  const today = new Date();
  const results: DailyCalories[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const localDate = getLocalDateString(d);
    const entries = listForDate(localDate);
    if (entries.length === 0) continue;

    let kcal = 0;
    for (const entry of entries) {
      if (entry.foodId) {
        const resolved = resolvedNutritionFor(entry.foodId);
        if (resolved) kcal += resolved.kcal * entry.servings;
      } else {
        kcal += (entry.quickAddKcal ?? 0) * entry.servings;
      }
    }
    results.push({ localDate, kcal });
  }

  return results;
}

/** Generates this week's check-in if one doesn't already exist locally (including one that
 * arrived via a pull from another device) and the logging readiness gate is met. */
export function generateCheckIn(): CheckInRow | 'not-ready' | 'already-exists' {
  if (currentWeekCheckIn()) return 'already-exists';

  const profile = getProfile();
  const plannedRateKgPerWeek = profile?.rateKgPerWeek ?? 0;
  const weighIns = listWeightEntries().map((w) => ({ localDate: w.localDate, weightKg: w.weightKg }));
  const dailyCaloriesLogged = dailyCaloriesForWindow(WINDOW_DAYS_FOR_CALORIE_HISTORY);
  const today = getLocalDateString();

  const result = evaluateWeeklyCheckIn({ weighIns, plannedRateKgPerWeek, dailyCaloriesLogged, today });
  if (!result.ready) return 'not-ready';

  const db = getDb();
  const now = new Date().toISOString();
  const entry = buildGenerateCheckInChange({
    weekStart: currentWeekWeekStart(),
    trendChange: result.trendChangeKgPerWeek,
    suggestedKcal: result.suggestedKcalChange,
    now,
    newId: generateId(),
  });

  db.insert(checkIn).values(entry).run();
  // Deliberately no notifyLocalWrite()/outbox here — see module doc above.
  return entry;
}

/** Records the user's decision on an existing check-in, enqueues the first (and only) outbox op
 * for it, and — on `'accepted'`/`'edited'` — creates a new `targets` row applying the (possibly
 * user-edited) calorie adjustment on top of the current targets (PRD §4.4 step 4). */
export function recordDecision(
  id: string,
  decision: 'accepted' | 'edited' | 'skipped',
  editedKcalChange?: number,
): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.transaction((tx) => {
    const existing = (tx.select().from(checkIn).where(eq(checkIn.id, id)).all()[0] ?? null) as CheckInRow | null;
    if (!existing) return;

    const { entry, outboxRow } = buildRecordDecisionChange({ existing, decision, editedKcalChange, now, newOpId: generateId() });
    tx.update(checkIn).set(entry).where(eq(checkIn.id, id)).run();
    tx.insert(outbox).values(outboxRow).run();
  });

  notifyLocalWrite();

  if (decision !== 'accepted' && decision !== 'edited') return;

  const updated = (db.select().from(checkIn).where(eq(checkIn.id, id)).all()[0] ?? null) as CheckInRow | null;
  const base = latestTargets();
  if (!updated || !base) return;

  const kcalChange = updated.suggestedKcal;
  createTargets(
    {
      effectiveFrom: getLocalDateString(),
      kcalRest: base.kcalRest + kcalChange,
      kcalTraining: base.kcalTraining + kcalChange,
      proteinG: base.proteinG,
      fatG: base.fatG,
      carbG: base.carbG,
      waterMl: base.waterMl,
    },
    'check-in',
  );
}
