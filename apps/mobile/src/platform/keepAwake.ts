import { activateKeepAwakeAsync, deactivateKeepAwake as expoDeactivateKeepAwake } from 'expo-keep-awake';

const TAG = 'active-workout';

/** Fire-and-forget by design (matches the pre-existing sync signature) — the active workout
 * screen doesn't need to block on this; a failure here just means the screen can sleep. */
export function activateKeepAwake(): void {
  void activateKeepAwakeAsync(TAG);
}

export function deactivateKeepAwake(): void {
  void expoDeactivateKeepAwake(TAG);
}
