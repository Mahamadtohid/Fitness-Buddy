import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, ThemeMode } from './tokens';
import { getSecureItem, setSecureItem } from '../platform/secureStorage';

/**
 * What the user picked in Settings. `'system'` defers to the OS setting and follows it live;
 * `'light'`/`'dark'` pin the app regardless of the OS (FitTrack guidelines §2 and §6.8, which
 * require all three options and that the choice survives a restart).
 */
export type ThemePreference = ThemeMode | 'system';

const PREFERENCE_KEY = 'theme.preference';

function isPreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

type Theme = {
  /** The theme actually in effect, after resolving `'system'` against the current OS setting. */
  mode: ThemeMode;
  colors: (typeof palettes)['light'];
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  // Starts at 'system' so the first frame matches the OS, then switches if a stored choice loads.
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let cancelled = false;
    getSecureItem(PREFERENCE_KEY)
      .then((stored) => {
        if (!cancelled && isPreference(stored)) setPreferenceState(stored);
      })
      // Best-effort: an unreadable preference just leaves the app following the OS.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void setSecureItem(PREFERENCE_KEY, next).catch(() => {});
  }, []);

  const mode: ThemeMode = preference === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<Theme>(
    () => ({ mode, colors: palettes[mode], preference, setPreference }),
    [mode, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
