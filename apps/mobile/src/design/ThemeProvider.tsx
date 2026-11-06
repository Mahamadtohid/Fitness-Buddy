import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, ThemeMode } from './tokens';

type Theme = {
  mode: ThemeMode;
  colors: (typeof palettes)['light'];
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const mode: ThemeMode = scheme === 'dark' ? 'dark' : 'light';

  const value = useMemo<Theme>(() => ({ mode, colors: palettes[mode] }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
