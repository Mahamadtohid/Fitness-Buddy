import type { ProfileInput } from './bmr';

/** PRD §4.2 macro targets. Builds on bmr.ts's calorie targets — does not duplicate them. */
export const DEFAULT_PROTEIN_G_PER_KG = 1.8;
export const PROTEIN_G_PER_KG_RANGE = { min: 1.6, max: 2.2 } as const;

const FAT_PERCENT_OF_CALORIES = 0.25;
const FAT_FLOOR_G_PER_KG = 0.6;
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;
const BMI_OBESE_THRESHOLD = 30;

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * PRD §4.2: "Protein: 1.8 g/kg body weight by default (range 1.6-2.2). If BMI > 30, use goal
 * weight." `goalWeightKg` is optional — when BMI is over the threshold but no goal weight is on
 * hand yet, this falls back to current weight rather than guessing one.
 */
export function calculateProteinTarget(params: {
  weightKg: number;
  heightCm: number;
  goalWeightKg?: number;
  gPerKg?: number;
}): number {
  const { weightKg, heightCm, goalWeightKg, gPerKg = DEFAULT_PROTEIN_G_PER_KG } = params;
  const bmi = calculateBmi(weightKg, heightCm);
  const baseWeightKg = bmi > BMI_OBESE_THRESHOLD && goalWeightKg ? goalWeightKg : weightKg;
  return baseWeightKg * gPerKg;
}

/** PRD §4.2: "Fat: 25% of calories, never below 0.6 g/kg." */
export function calculateFatTarget(calories: number, weightKg: number): number {
  const fromPercent = (calories * FAT_PERCENT_OF_CALORIES) / KCAL_PER_G_FAT;
  const floor = FAT_FLOOR_G_PER_KG * weightKg;
  return Math.max(fromPercent, floor);
}

/** PRD §4.2: "Carbs: remaining calories." Never negative — a very low calorie target with a high
 * protein/fat floor just means zero carbs, not a deficit. */
export function calculateCarbTarget(calories: number, proteinG: number, fatG: number): number {
  const remaining = calories - proteinG * KCAL_PER_G_PROTEIN - fatG * KCAL_PER_G_FAT;
  return Math.max(0, remaining / KCAL_PER_G_CARB);
}

export type MacroTargets = { proteinG: number; fatG: number; carbG: number };

/** Composes all three macro targets for a given calorie target in one call — what
 * targetsRepository uses when creating a new targets row (see PRD §4.1-§4.2). */
export function calculateMacroTargets(
  calories: number,
  profile: Pick<ProfileInput, 'weightKg' | 'heightCm'> & { goalWeightKg?: number },
): MacroTargets {
  const proteinG = calculateProteinTarget(profile);
  const fatG = calculateFatTarget(calories, profile.weightKg);
  const carbG = calculateCarbTarget(calories, proteinG, fatG);
  return { proteinG, fatG, carbG };
}
