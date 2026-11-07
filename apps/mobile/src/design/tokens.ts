export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export const typeScale = {
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  headline: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  /** Big stat numbers (e.g. "1,247", "72.4") — matches the reference UI mockup. */
  statLarge: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const },
  /** The smaller unit/suffix next to a stat (e.g. "kcal", "kg") — pair with color="secondary". */
  statUnit: { fontSize: 14, lineHeight: 18, fontWeight: '400' as const },
};

const lightColors = {
  background: '#FFFFFF',
  surface: '#F5F6F8',
  surfaceAlt: '#ECEEF1',
  border: '#DDE1E6',
  textPrimary: '#14171A',
  textSecondary: '#5B6168',
  accent: '#1E6B52',
  accentOn: '#FFFFFF',
  danger: '#B3261E',
  warning: '#8A5A00',
  success: '#1E6B52',
};

/** Matches the reference UI mockup exactly — near-black with a vivid emerald accent. */
const darkColors = {
  background: '#0B0F0D',
  surface: '#141A17',
  surfaceAlt: '#1E2622',
  border: '#232B27',
  textPrimary: '#F5F7F5',
  textSecondary: '#8C958F',
  accent: '#22C55E',
  accentOn: '#0B1F15',
  danger: '#FF8A80',
  warning: '#E8B339',
  success: '#22C55E',
};

export const palettes = {
  light: lightColors,
  dark: darkColors,
};

export type ColorToken = keyof typeof lightColors;
export type ThemeMode = keyof typeof palettes;
