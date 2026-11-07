import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { create } from 'zustand';

import { deleteSecureItem, getSecureItem, setSecureItem } from '../../platform/secureStorage';

const ENABLED_KEY = 'appLock.enabled';
const PIN_HASH_KEY = 'appLock.pinHash';

async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
}

type AppLockState = {
  enabled: boolean;
  isLocked: boolean;
  isBootstrapped: boolean;
  /** Loads the persisted enabled flag on app start; call once from the root layout. If app lock
   * is enabled, the app starts locked and requires a PIN/biometric unlock before anything behind
   * `AppLockGate` is reachable. */
  bootstrap: () => Promise<void>;
  /** Hashes and stores the PIN (never the raw value), turns app lock on, and leaves the app
   * unlocked — the user just set it up, no need to immediately re-challenge them. */
  setPin: (pin: string) => Promise<void>;
  /** Turns app lock off and removes the stored PIN hash — the caller is responsible for
   * re-authenticating the user first (biometric or PIN) before calling this. */
  disable: () => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  /** Only meaningful when `enabled` — re-locks the app (e.g. on backgrounding). */
  lock: () => void;
};

export const useAppLockStore = create<AppLockState>((set, get) => ({
  enabled: false,
  isLocked: false,
  isBootstrapped: false,

  bootstrap: async () => {
    const enabledFlag = await getSecureItem(ENABLED_KEY);
    const enabled = enabledFlag === 'true';
    set({ enabled, isLocked: enabled, isBootstrapped: true });
  },

  setPin: async (pin) => {
    const pinHash = await hashPin(pin);
    await setSecureItem(PIN_HASH_KEY, pinHash);
    await setSecureItem(ENABLED_KEY, 'true');
    set({ enabled: true, isLocked: false });
  },

  disable: async () => {
    await deleteSecureItem(PIN_HASH_KEY);
    await deleteSecureItem(ENABLED_KEY);
    set({ enabled: false, isLocked: false });
  },

  unlockWithPin: async (pin) => {
    const storedHash = await getSecureItem(PIN_HASH_KEY);
    if (!storedHash) return false;

    const inputHash = await hashPin(pin);
    if (inputHash !== storedHash) return false;

    set({ isLocked: false });
    return true;
  },

  unlockWithBiometric: async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock FitTrack',
    });
    if (!result.success) return false;

    set({ isLocked: false });
    return true;
  },

  lock: () => {
    if (!get().enabled) return;
    set({ isLocked: true });
  },
}));
