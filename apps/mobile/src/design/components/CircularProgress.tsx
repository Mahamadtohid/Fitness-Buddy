import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../ThemeProvider';

type Props = {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
};

/** A ring progress indicator (Today's calorie/protein rings in the reference UI mockup) — plain
 * SVG circle + arc, no charting library. `children` render centered inside the ring. */
export function CircularProgress({ value, max, size = 120, strokeWidth = 10, color, children }: Props) {
  const { colors } = useTheme();
  const progressColor = color ?? colors.accent;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={center} cy={center} r={radius} stroke={colors.surfaceAlt} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}
