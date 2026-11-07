import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

export type LineChartPoint = { label: string; value: number };

type Props = {
  points: LineChartPoint[];
  height?: number;
  color?: string;
  emptyMessage?: string;
};

/**
 * Minimal single-series line chart with point markers and evenly-spaced labels below (Progress's
 * weight trend in the reference UI mockup). Deliberately simple — straight segments between
 * points, no library, no animation, no tooltip — consistent with this project's standing "no
 * ornamental charts" decision (PRD §6), just implemented with SVG now that the mockup calls for an
 * actual line rather than bars. Assumes evenly-spaced points (true for the weekly series this is
 * built for) so labels can be laid out with plain flexbox instead of precise SVG text positioning.
 */
export function LineChart({ points, height = 120, color, emptyMessage }: Props) {
  const { colors } = useTheme();
  const lineColor = color ?? colors.accent;

  if (points.length === 0) {
    return (
      <Typography variant="caption" color="secondary">
        {emptyMessage ?? 'Log a few weigh-ins to see your trend.'}
      </Typography>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 8;
  const width = 1000; // viewBox units — SVG scales to the actual rendered width via the wrapper.

  const coords = points.map((p, i) => {
    const x = points.length === 1 ? width / 2 : (i / (points.length - 1)) * width;
    const y = padding + (1 - (p.value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Polyline
          points={coords.map((c) => `${c.x},${c.y}`).join(' ')}
          fill="none"
          stroke={lineColor}
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
        />
        {coords.map((c, i) => (
          <Circle key={i} cx={c.x} cy={c.y} r={6} fill={lineColor} />
        ))}
      </Svg>
      <View style={styles.labelRow}>
        {points.map((p) => (
          <Typography key={p.label} variant="caption" color="secondary">
            {p.label}
          </Typography>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
});
