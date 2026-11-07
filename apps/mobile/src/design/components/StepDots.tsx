import React from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';

type Props = {
  count: number;
  /** Zero-based index of the step currently shown. */
  current: number;
};

/** Progress indicator for a multi-step flow (guidelines §6.3: "Show progress through the setup
 * flow"). The current step is a wider accent pill rather than only a different colour, so the
 * position is readable without relying on colour alone. */
export function StepDots({ count, current }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === current ? styles.active : null,
            { backgroundColor: index === current ? colors.accent : colors.surfaceAlt },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  dot: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },
  active: {
    width: 28,
  },
});
