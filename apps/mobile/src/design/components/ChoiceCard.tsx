import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing } from '../tokens';
import { useTheme } from '../ThemeProvider';
import { Typography } from './Typography';

type Props = {
  label: string;
  description?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
};

/**
 * Tap-to-select row used by the onboarding steps (UI mockup): an icon badge, a label with an
 * optional one-line description, and a chevron. Selecting fills the row with the accent so the
 * choice is obvious at a glance — and the state is carried by more than colour alone (the chevron
 * and badge invert too), which guidelines §13 requires.
 */
export function ChoiceCard({ label, description, icon, selected, onPress }: Props) {
  const { colors } = useTheme();
  const contentColor = selected ? colors.accentOn : colors.textPrimary;
  const subColor = selected ? colors.accentOn : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? colors.accentFill : colors.surface,
          borderColor: selected ? colors.accentFill : colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: selected ? colors.accentOn : colors.surfaceAlt }]}>
        <Ionicons name={icon} size={20} color={String(selected ? colors.accentFill : colors.accent)} />
      </View>
      <View style={styles.text}>
        <Typography variant="bodyStrong" style={{ color: contentColor }}>
          {label}
        </Typography>
        {description ? (
          <Typography variant="caption" style={{ color: subColor }}>
            {description}
          </Typography>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={String(subColor)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 68,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
