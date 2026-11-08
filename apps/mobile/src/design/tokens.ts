export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Edge padding for a screen's content (FitTrack guidelines §4: "Typical screen padding: 16–20 px").
 * Kept separate from the `spacing` scale because that scale is also used for gaps and margins —
 * screens previously padded with `spacing.lg` (24px), which sat outside the guideline range and
 * cost content width on small devices.
 */
export const screenPadding = 20;

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
 * FitTrack visual system. The dark palette is taken from the design-system sheet in the UI mockup
 * (slate backgrounds `#0F172A`/`#1E293B`/`#334155`, text `#F8FAFC`/`#94A3B8`, and the emerald,
 * amber and red semantic colors); the light palette is derived from the written guidelines' §4
 * table, since the mockup only specifies dark.
 *
 * Why there are two greens: the mockup's primary `#0E7A5A` reads well as a *button fill* under a
 * white label (5.08:1) but only manages 2.75:1 as *text* on the dark surface, far below AA — and
 * conversely a green bright enough to be legible as text can't carry a white label. No single
 * value satisfies both roles, so they're split: `accent` is the bright green used for text, icons,
 * active states and chart strokes, while `accentFill`/`accentOn` are the primary button's
 * background and label. Every pairing below clears AA for its actual use.
 */
const lightColors = {
  background: '#F5F7F8',
  surface: '#FFFFFF',
  surfaceAlt: '#EAEEF1',
  border: '#E1E6E9',
  textPrimary: '#17212A',
  textSecondary: '#56616C',
  accent: '#0E7A5A',
  accentFill: '#0E7A5A',
  accentOn: '#FFFFFF',
  danger: '#DC4242',
  warning: '#8A5A00',
  success: '#0E7A5A',
};

const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  border: '#475569',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  accent: '#22C55E',
  accentFill: '#0E7A5A',
  accentOn: '#F8FAFC',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#16A34A',
};

export const accentTones = {
  emerald: {
    light: { accent: '#0E7A5A', accentFill: '#0E7A5A', success: '#0E7A5A' },
    dark: { accent: '#22C55E', accentFill: '#0E7A5A', success: '#16A34A' },
  },
  blue: {
    light: { accent: '#2563EB', accentFill: '#2563EB', success: '#2563EB' },
    dark: { accent: '#60A5FA', accentFill: '#2563EB', success: '#3B82F6' },
  },
  purple: {
    light: { accent: '#7C3AED', accentFill: '#7C3AED', success: '#7C3AED' },
    dark: { accent: '#A78BFA', accentFill: '#7C3AED', success: '#8B5CF6' },
  },
  orange: {
    light: { accent: '#C2410C', accentFill: '#C2410C', success: '#C2410C' },
    dark: { accent: '#FB923C', accentFill: '#C2410C', success: '#F97316' },
  },
  coral: {
    light: { accent: '#E11D48', accentFill: '#E11D48', success: '#E11D48' },
    dark: { accent: '#FB7185', accentFill: '#E11D48', success: '#F43F5E' },
  },
} as const;

export type AccentTone = keyof typeof accentTones;

export const palettes = {
  light: lightColors,
  dark: darkColors,
};

export function getColors(mode: ThemeMode, accentTone: AccentTone = 'emerald') {
  return { ...palettes[mode], ...accentTones[accentTone][mode] };
}

export type ColorToken = keyof typeof lightColors;
export type ThemeMode = keyof typeof palettes;
