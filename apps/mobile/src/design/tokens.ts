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

/**
 * FitTrack global visual system (design guidelines §4). The seven tokens the guidelines name
 * explicitly — background, surface, accent, primary/secondary text, border and error — are taken
 * verbatim. `surfaceAlt`, `accentOn`, `warning` and `success` aren't in that table, so they're
 * derived to sit coherently with it rather than invented as new brand colors: `surfaceAlt` sits
 * between surface and border, `accentOn` is whichever of background/white reads cleanly on the
 * accent fill, and `success` mirrors the accent.
 *
 * One deliberate deviation: the guidelines' light accent `#159C70` only reaches 3.3–3.5:1 against
 * the light background/surface, which is fine for fills and large text but short of the 4.5:1 AA
 * threshold this palette needs for accent-colored captions and white button labels. Darkened one
 * shade to `#0E7A5A` (4.95:1 on background, 5.32:1 on surface) — same emerald identity, legible at
 * body/caption sizes. The dark theme's `#42C99A` is used exactly as specified; it already clears
 * AA comfortably (7.9–8.9:1).
 */
const lightColors = {
  background: '#F5F7F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EAEEF1',
  border: '#E1E6E9',
  textPrimary: '#17212A',
  textSecondary: '#56616C',
  accent: '#0E7A5A',
  accentOn: '#FFFFFF',
  danger: '#DC4242',
  warning: '#8A5A00',
  success: '#0E7A5A',
};

const darkColors = {
  background: '#101419',
  surface: '#1A2026',
  surfaceAlt: '#232A31',
  border: '#303840',
  textPrimary: '#F4F7FA',
  textSecondary: '#AAB3BD',
  accent: '#42C99A',
  accentOn: '#101419',
  danger: '#F87171',
  warning: '#E8B339',
  success: '#42C99A',
};

export const palettes = {
  light: lightColors,
  dark: darkColors,
};

export type ColorToken = keyof typeof lightColors;
export type ThemeMode = keyof typeof palettes;
