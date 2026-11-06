import { pullLatest } from './pullProcessor';
import { pushPending } from './outboxProcessor';
import { useSyncStatusStore } from './syncStatusStore';

const MAX_BACKOFF_SECONDS = 5 * 60;
const DEBOUNCE_MS = 2000;

let syncing = false;
let backoffAttempt = 0;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Push then pull once; never runs two in parallel. On failure, schedules a backoff retry. */
export async function runSync(): Promise<void> {
  if (syncing) return;
  syncing = true;
  useSyncStatusStore.getState().setStatus('syncing');

  try {
    await pushPending();
    await pullLatest();
    backoffAttempt = 0;
    useSyncStatusStore.getState().setSynced(new Date().toISOString());
  } catch (err) {
    backoffAttempt += 1;
    const message = err instanceof Error ? err.message : 'Sync failed';
    useSyncStatusStore.getState().setStatus('error', message);
    scheduleBackoffRetry();
  } finally {
    syncing = false;
  }
}

function scheduleBackoffRetry(): void {
  if (backoffTimer) clearTimeout(backoffTimer);
  const base = Math.min(MAX_BACKOFF_SECONDS, 2 * 2 ** backoffAttempt);
  const jittered = base * (0.8 + Math.random() * 0.4);
  backoffTimer = setTimeout(() => void runSync(), jittered * 1000);
}

/** Bypasses backoff — used by "Sync now" and by reconnect/foreground triggers. */
export function retryNow(): void {
  backoffAttempt = 0;
  void runSync();
}

/** 2s-debounced trigger after a local write (PRD §7.5 step 2). */
export function scheduleDebouncedSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => void runSync(), DEBOUNCE_MS);
}

export function markOffline(): void {
  useSyncStatusStore.getState().setStatus('offline');
}
