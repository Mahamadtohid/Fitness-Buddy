export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function triggerHaptic(_style: HapticStyle): Promise<void> {
  throw new Error('Not implemented: wired up in the Workouts phase (PRD §3.3)');
}
