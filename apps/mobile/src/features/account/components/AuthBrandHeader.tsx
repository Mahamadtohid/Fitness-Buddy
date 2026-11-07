import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { spacing, Typography, useTheme } from '../../../design';

/**
 * Logo lockup at the top of the sign-in and sign-up screens (UI mockup; guidelines §6.2 asks for
 * the logo plus a short welcome heading).
 *
 * The mark is currently the icon set's dumbbell glyph rather than the real FitTrack emblem — the
 * only brand images supplied so far are lit renders with a glow halo, which can't be reduced to a
 * clean flat mark. Swap this for an <Image> once a flat/SVG emblem exists.
 */
export function AuthBrandHeader() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.lockup}>
        <MaterialCommunityIcons name="dumbbell" size={28} color={String(colors.accent)} />
        <View style={styles.wordmark}>
          <Typography variant="headline">Fit</Typography>
          <Typography variant="headline" color="accent">
            Track
          </Typography>
        </View>
      </View>
      <Typography variant="caption" color="secondary" style={styles.tagline}>
        TRAIN. FUEL. PROGRESS.
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordmark: {
    flexDirection: 'row',
  },
  tagline: {
    letterSpacing: 1.2,
  },
});
