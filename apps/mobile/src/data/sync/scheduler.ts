import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus } from 'react-native';

import { markOffline, retryNow, scheduleDebouncedSync } from './engine';
import { setLocalWriteListener } from './writeHook';

const FOREGROUND_INTERVAL_MS = 60_000;

let started = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

function startInterval(): void {
  if (intervalId) return;
  intervalId = setInterval(() => retryNow(), FOREGROUND_INTERVAL_MS);
}

function stopInterval(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Wires every sync trigger from PRD §7.5 step 2: app start/foreground, reconnect, a 60s interval
 * while foregrounded, and a debounced trigger after local writes. Call once, after login.
 */
export function initSync(): void {
  if (started) return;
  started = true;

  setLocalWriteListener(() => scheduleDebouncedSync());

  AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      retryNow();
      startInterval();
    } else {
      stopInterval();
    }
  });

  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      retryNow();
    } else {
      markOffline();
    }
  });

  retryNow();
  startInterval();
}
