import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AccentTone, getColors, ThemeMode } from './tokens';
import { getSecureItem, setSecureItem } from '../platform/secureStorage';

/**
 * What the user picked in Settings. `'system'` defers to the OS setting and follows it live;
 * `'light'`/`'dark'` pin the app regardless of the OS (FitTrack guidelines §2 and §6.8, which
 * require all three options and that the choice survives a restart).
 */
export type ThemePreference = ThemeMode | 'system';

const PREFERENCE_KEY = 'theme.preference';
const ACCENT_KEY = 'theme.accent';

function isPreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isAccentTone(value: string | null): value is AccentTone {
  return value === 'emerald' || value === 'blue' || value === 'purple' || value === 'orange' || value === 'coral';
}

type Theme = {
  /** The theme actually in effect, after resolving `'system'` against the current OS setting. */
  mode: ThemeMode;
  colors: ReturnType<typeof getColors>;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  accentTone: AccentTone;
  setAccentTone: (accentTone: AccentTone) => void;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  // Starts at 'system' so the first frame matches the OS, then switches if a stored choice loads.
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [accentTone, setAccentToneState] = useState<AccentTone>('emerald');

  useEffect(() => {
    let cancelled = false;
    getSecureItem(PREFERENCE_KEY)
      .then((stored) => {
        if (!cancelled && isPreference(stored)) setPreferenceState(stored);
      })
      // Best-effort: an unreadable preference just leaves the app following the OS.
      .catch(() => {});
    getSecureItem(ACCENT_KEY)
      .then((stored) => {
        if (!cancelled && isAccentTone(stored)) setAccentToneState(stored);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void setSecureItem(PREFERENCE_KEY, next).catch(() => {});
  }, []);

  const setAccentTone = useCallback((next: AccentTone) => {
    setAccentToneState(next);
    void setSecureItem(ACCENT_KEY, next).catch(() => {});
  }, []);

  const mode: ThemeMode = preference === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<Theme>(
    () => ({ mode, colors: getColors(mode, accentTone), preference, setPreference, accentTone, setAccentTone }),
    [mode, accentTone, preference, setPreference, setAccentTone],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
