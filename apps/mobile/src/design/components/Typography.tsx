import React from 'react';
import { Text as RNText, TextProps } from 'react-native';

import { typeScale } from '../tokens';
import { useTheme } from '../ThemeProvider';

type Variant = keyof typeof typeScale;

type Props = TextProps & {
  variant?: Variant;
  color?: 'primary' | 'secondary' | 'accent' | 'danger';
};

export function Typography({ variant = 'body', color = 'primary', style, ...rest }: Props) {
  const { colors } = useTheme();
  const colorValue =
    color === 'secondary'
      ? colors.textSecondary
      : color === 'accent'
        ? colors.accent
        : color === 'danger'
          ? colors.danger
          : colors.textPrimary;

  return <RNText style={[typeScale[variant], { color: colorValue }, style]} {...rest} />;
}
