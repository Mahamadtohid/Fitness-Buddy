import React from 'react';
import Svg, { Polyline } from 'react-native-svg';

import { useTheme } from '../ThemeProvider';

type Props = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
};

/** Tiny inline trend line, no axes/labels/dots (Progress's "Nutrition trends" rows in the
 * reference UI mockup) — intentionally simpler than `LineChart`, for a glance, not a reading. */
export function Sparkline({ values, width = 80, height = 32, color }: Props) {
  const { colors } = useTheme();
  const lineColor = color ?? colors.accent;

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.min(...values) === Math.max(...values) ? min + 1 : Math.max(...values);
  const range = max - min;
  const padding = 3;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = padding + (1 - (v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}
