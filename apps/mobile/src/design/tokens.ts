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

const darkColors = {
  background: '#101214',
  surface: '#1A1D20',
  surfaceAlt: '#24282C',
  border: '#33383D',
  textPrimary: '#F2F3F4',
  textSecondary: '#A6ACB3',
  accent: '#4FBF95',
  accentOn: '#0B1210',
  danger: '#FF8A80',
  warning: '#E8B339',
  success: '#4FBF95',
};

export const palettes = {
  light: lightColors,
  dark: darkColors,
};

export type ColorToken = keyof typeof lightColors;
export type ThemeMode = keyof typeof palettes;
