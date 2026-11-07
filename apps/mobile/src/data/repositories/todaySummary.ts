import { listForDate } from './foodEntryRepository';
import { resolvedNutritionFor } from './foodRepository';
import { getSchedule } from './scheduleRepository';
import { latestTargets } from './targetsRepository';
import { totalForDate, waterTargetMl } from './waterEntryRepository';
import { listWeightEntries } from './weightEntryRepository';
import { hasSessionForDate } from './workoutSessionRepository';
import { listTemplates } from './workoutTemplateRepository';
import { getLocalDateString } from '../../platform/localDate';

const PROTEIN_HIT_TOLERANCE = 0.1; // within 10% of target (PRD §2 success metric)

/** Shifts an already-known-correct "YYYY-MM-DD" string by N days. UTC-midnight-anchored
 * arithmetic is the right tool here (unlike computing "today", see platform/localDate.ts) — it
 * round-trips any calendar date correctly regardless of the runtime's own timezone. */
export function daysBefore(localDate: string, n: number): string {
  const d = new Date(`${localDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Sums a day's `food_entry` rows into calories/protein, resolving each catalog/custom food
 * through `foodRepository.resolvedNutritionFor` (which already applies any `food_override`), or
 * using the quick-add raw values when there's no `foodId`. */
export function nutritionEatenForDate(localDate: string): { kcal: number; proteinG: number } {
  let kcal = 0;
  let proteinG = 0;

  for (const entry of listForDate(localDate)) {
    if (entry.foodId) {
      const resolved = resolvedNutritionFor(entry.foodId);
      if (resolved) {
        kcal += resolved.kcal * entry.servings;
        proteinG += resolved.proteinG * entry.servings;
      }
    } else {
      kcal += (entry.quickAddKcal ?? 0) * entry.servings;
      proteinG += (entry.quickAddProteinG ?? 0) * entry.servings;
    }
  }

  return { kcal, proteinG };
}

export type TodaySummary = {
  calories: { eaten: number; target: number };
  protein: { eatenG: number; targetG: number };
  water: { totalMl: number; targetMl: number };
  workout: { scheduledTemplateName: string | null; loggedToday: boolean };
  weighInLoggedToday: boolean;
  /** Oldest to newest, 7 entries ending today. */
  weekStrip: { localDate: string; trained: boolean; foodLogged: boolean; proteinHit: boolean }[];
};

export function getTodaySummary(): TodaySummary {
  const today = getLocalDateString();
  const trainedToday = hasSessionForDate(today);

  const targets = latestTargets();
  const eaten = nutritionEatenForDate(today);
  const caloriesTarget = targets ? (trainedToday ? targets.kcalTraining : targets.kcalRest) : 0;
  const proteinTarget = targets?.proteinG ?? 0;

  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const scheduledTemplateId = getSchedule().find((row) => row.weekday === weekday)?.templateId ?? null;
  const scheduledTemplateName = scheduledTemplateId
    ? (listTemplates().find((t) => t.id === scheduledTemplateId)?.name ?? null)
    : null;

  const weighInLoggedToday = listWeightEntries().some((row) => row.localDate === today);

  const weekStrip = Array.from({ length: 7 }, (_, i) => {
    const localDate = daysBefore(today, 6 - i);
    const dayEaten = nutritionEatenForDate(localDate);
    const dayTargets = targets; // same row used for every day in the strip — good enough for a simple week view
    const dayProteinTarget = dayTargets?.proteinG ?? 0;
    return {
      localDate,
      trained: hasSessionForDate(localDate),
      foodLogged: listForDate(localDate).length > 0,
      proteinHit: dayProteinTarget > 0 && Math.abs(dayEaten.proteinG - dayProteinTarget) <= dayProteinTarget * PROTEIN_HIT_TOLERANCE,
    };
  });

  return {
    calories: { eaten: eaten.kcal, target: caloriesTarget },
    protein: { eatenG: eaten.proteinG, targetG: proteinTarget },
    water: { totalMl: totalForDate(today), targetMl: waterTargetMl() },
    workout: { scheduledTemplateName, loggedToday: trainedToday },
    weighInLoggedToday,
    weekStrip,
  };
}
