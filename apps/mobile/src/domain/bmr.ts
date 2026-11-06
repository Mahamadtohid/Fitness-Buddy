export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';

export type ProfileInput = {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  lifestyleFactor: number;
  /** kg/week; negative to lose, positive to gain, 0 to maintain */
  rateKgPerWeek: number;
};

const KCAL_PER_KG = 7700;

export function calculateBmr({ sex, weightKg, heightCm, ageYears }: ProfileInput): number {
  const sexOffset = sex === 'male' ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + sexOffset;
}

export function calculateRestDayTarget(input: ProfileInput): number {
  const bmr = calculateBmr(input);
  return bmr * input.lifestyleFactor + (input.rateKgPerWeek * KCAL_PER_KG) / 7;
}

export function calculateTrainingDayTarget(
  input: ProfileInput,
  trainingBumpKcal = 300,
): number {
  return calculateRestDayTarget(input) + trainingBumpKcal;
}

/** Shared by onboarding and Settings — age isn't stored on the profile, only `birthDate` is, so
 * every BMR calculation derives it fresh. `now` is injectable for deterministic tests. */
export function calculateAgeFromBirthDate(birthDate: string, now: Date = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const hadBirthdayThisYear =
    now.getUTCMonth() > birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() >= birth.getUTCDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}
