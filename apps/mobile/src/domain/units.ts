export type Units = 'metric' | 'imperial';

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}

/** Storage is always metric (kg) — `units` only picks how the value is displayed. */
export function formatWeight(kg: number, units: Units): string {
  return units === 'imperial' ? `${kgToLb(kg).toFixed(1)} lb` : `${kg.toFixed(1)} kg`;
}

/** Storage is always metric (cm) — `units` only picks how the value is displayed. Metric shows
 * a whole number (matching how height/measurements are already entered elsewhere in this app),
 * imperial shows one decimal since an inch is a coarser unit. */
export function formatLength(cm: number, units: Units): string {
  return units === 'imperial' ? `${cmToIn(cm).toFixed(1)} in` : `${Math.round(cm)} cm`;
}

/** Returns kg regardless of the input units — callers always store the result as-is. */
export function parseWeightInput(str: string, units: Units): number {
  const value = Number(str);
  return units === 'imperial' ? lbToKg(value) : value;
}

/** Returns cm regardless of the input units — callers always store the result as-is. */
export function parseLengthInput(str: string, units: Units): number {
  const value = Number(str);
  return units === 'imperial' ? inToCm(value) : value;
}
