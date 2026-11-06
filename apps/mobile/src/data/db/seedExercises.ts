/**
 * Static exercise catalog (PRD §3.3 "~80 common gym exercises, grouped by muscle"). Shipped as
 * bundled data and inserted once at first boot (see seed.ts) — this never syncs, the ids are
 * fixed forever so they're safe to reference from templates/sessions across app versions.
 */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'calves';

export type SeedExercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string | null;
  isLowerBody: boolean;
  repMin: number;
  repMax: number;
  restSeconds: number;
};

const LOWER_BODY_GROUPS: ReadonlySet<MuscleGroup> = new Set(['quads', 'hamstrings', 'glutes', 'calves']);

function fixedId(n: number): string {
  return `10000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
}

type RawExercise = [name: string, group: MuscleGroup, equipment: string | null, repMin: number, repMax: number, restSeconds: number];

const RAW: RawExercise[] = [
  // Chest
  ['Barbell Bench Press', 'chest', 'barbell', 5, 8, 150],
  ['Incline Barbell Bench Press', 'chest', 'barbell', 6, 10, 120],
  ['Dumbbell Bench Press', 'chest', 'dumbbell', 8, 12, 120],
  ['Incline Dumbbell Press', 'chest', 'dumbbell', 8, 12, 120],
  ['Decline Barbell Bench Press', 'chest', 'barbell', 6, 10, 120],
  ['Dumbbell Fly', 'chest', 'dumbbell', 10, 15, 60],
  ['Cable Fly', 'chest', 'cable', 10, 15, 60],
  ['Cable Crossover', 'chest', 'cable', 10, 15, 60],
  ['Push-Up', 'chest', 'bodyweight', 10, 20, 60],
  ['Chest Dip', 'chest', 'bodyweight', 8, 12, 90],
  ['Machine Chest Press', 'chest', 'machine', 8, 12, 90],
  ['Pec Deck', 'chest', 'machine', 10, 15, 60],

  // Back
  ['Deadlift', 'back', 'barbell', 3, 6, 180],
  ['Sumo Deadlift', 'back', 'barbell', 3, 6, 180],
  ['Trap Bar Deadlift', 'back', 'barbell', 5, 8, 150],
  ['Barbell Row', 'back', 'barbell', 6, 10, 120],
  ['Pendlay Row', 'back', 'barbell', 6, 10, 120],
  ['Pull-Up', 'back', 'bodyweight', 6, 10, 120],
  ['Chin-Up', 'back', 'bodyweight', 6, 10, 120],
  ['Lat Pulldown', 'back', 'cable', 8, 12, 90],
  ['Seated Cable Row', 'back', 'cable', 8, 12, 90],
  ['Single-Arm Dumbbell Row', 'back', 'dumbbell', 8, 12, 90],
  ['T-Bar Row', 'back', 'barbell', 8, 12, 90],
  ['Face Pull', 'back', 'cable', 12, 20, 60],
  ['Straight-Arm Pulldown', 'back', 'cable', 10, 15, 60],

  // Shoulders
  ['Overhead Press', 'shoulders', 'barbell', 5, 8, 150],
  ['Dumbbell Shoulder Press', 'shoulders', 'dumbbell', 8, 12, 90],
  ['Arnold Press', 'shoulders', 'dumbbell', 8, 12, 90],
  ['Landmine Press', 'shoulders', 'barbell', 8, 12, 90],
  ['Lateral Raise', 'shoulders', 'dumbbell', 12, 20, 60],
  ['Cable Lateral Raise', 'shoulders', 'cable', 12, 20, 60],
  ['Front Raise', 'shoulders', 'dumbbell', 10, 15, 60],
  ['Rear Delt Fly', 'shoulders', 'dumbbell', 12, 20, 60],
  ['Reverse Pec Deck', 'shoulders', 'machine', 12, 20, 60],
  ['Upright Row', 'shoulders', 'barbell', 8, 12, 60],
  ['Barbell Shrug', 'shoulders', 'barbell', 10, 15, 90],
  ['Dumbbell Shrug', 'shoulders', 'dumbbell', 10, 15, 90],

  // Quads
  ['Back Squat', 'quads', 'barbell', 5, 8, 180],
  ['Front Squat', 'quads', 'barbell', 5, 8, 150],
  ['Leg Press', 'quads', 'machine', 8, 12, 120],
  ['Hack Squat', 'quads', 'machine', 8, 12, 120],
  ['Leg Extension', 'quads', 'machine', 10, 15, 60],
  ['Bulgarian Split Squat', 'quads', 'dumbbell', 8, 12, 90],
  ['Walking Lunge', 'quads', 'dumbbell', 10, 15, 90],
  ['Goblet Squat', 'quads', 'dumbbell', 10, 15, 90],
  ['Step-Up', 'quads', 'dumbbell', 8, 12, 90],
  ['Sissy Squat', 'quads', 'bodyweight', 10, 15, 60],

  // Hamstrings & Glutes
  ['Romanian Deadlift', 'hamstrings', 'barbell', 6, 10, 120],
  ['Stiff-Leg Deadlift', 'hamstrings', 'barbell', 6, 10, 120],
  ['Lying Leg Curl', 'hamstrings', 'machine', 10, 15, 60],
  ['Seated Leg Curl', 'hamstrings', 'machine', 10, 15, 60],
  ['Nordic Hamstring Curl', 'hamstrings', 'bodyweight', 5, 8, 90],
  ['Good Morning', 'hamstrings', 'barbell', 8, 12, 90],
  ['Hip Thrust', 'glutes', 'barbell', 6, 10, 120],
  ['Glute Bridge', 'glutes', 'bodyweight', 10, 15, 60],
  ['Cable Pull-Through', 'glutes', 'cable', 10, 15, 90],
  ['Cable Glute Kickback', 'glutes', 'cable', 12, 20, 60],

  // Biceps
  ['Barbell Curl', 'biceps', 'barbell', 8, 12, 60],
  ['Dumbbell Curl', 'biceps', 'dumbbell', 8, 12, 60],
  ['Hammer Curl', 'biceps', 'dumbbell', 8, 12, 60],
  ['Preacher Curl', 'biceps', 'barbell', 8, 12, 60],
  ['Incline Dumbbell Curl', 'biceps', 'dumbbell', 8, 12, 60],
  ['Cable Curl', 'biceps', 'cable', 10, 15, 60],
  ['Concentration Curl', 'biceps', 'dumbbell', 10, 15, 60],

  // Triceps
  ['Triceps Pushdown', 'triceps', 'cable', 10, 15, 60],
  ['Overhead Triceps Extension', 'triceps', 'dumbbell', 8, 12, 60],
  ['Skull Crusher', 'triceps', 'barbell', 8, 12, 60],
  ['Close-Grip Bench Press', 'triceps', 'barbell', 6, 10, 120],
  ['Triceps Dip', 'triceps', 'bodyweight', 8, 12, 90],
  ['Cable Triceps Kickback', 'triceps', 'cable', 12, 20, 60],

  // Core
  ['Plank', 'core', 'bodyweight', 1, 1, 60],
  ['Hanging Leg Raise', 'core', 'bodyweight', 8, 15, 60],
  ['Cable Crunch', 'core', 'cable', 12, 20, 60],
  ['Sit-Up', 'core', 'bodyweight', 12, 20, 45],
  ['Russian Twist', 'core', 'bodyweight', 12, 20, 45],
  ['Ab Wheel Rollout', 'core', 'bodyweight', 8, 12, 60],
  ['Bicycle Crunch', 'core', 'bodyweight', 15, 25, 45],

  // Calves
  ['Standing Calf Raise', 'calves', 'machine', 10, 15, 60],
  ['Seated Calf Raise', 'calves', 'machine', 12, 20, 60],
  ['Leg Press Calf Raise', 'calves', 'machine', 12, 20, 60],
  ['Donkey Calf Raise', 'calves', 'machine', 12, 20, 60],
];

export const SEED_EXERCISES: SeedExercise[] = RAW.map(([name, muscleGroup, equipment, repMin, repMax, restSeconds], i) => ({
  id: fixedId(i + 1),
  name,
  muscleGroup,
  equipment,
  isLowerBody: LOWER_BODY_GROUPS.has(muscleGroup),
  repMin,
  repMax,
  restSeconds,
}));
