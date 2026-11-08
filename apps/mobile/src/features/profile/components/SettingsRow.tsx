import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, spacing, Typography, useTheme } from '../../../design';

type Props = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
};

export function SettingsRow({ icon, label, description, value, onPress }: Props) {
  const { colors } = useTheme();
  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={18} color={String(colors.accent)} />
      </View>
      <View style={styles.copy}>
        <Typography variant="bodyStrong">{label}</Typography>
        {description ? <Typography variant="caption" color="secondary">{description}</Typography> : null}
      </View>
      {value ? <Typography variant="caption" color="secondary" style={styles.value}>{value}</Typography> : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={String(colors.textSecondary)} /> : null}
    </>
  );

  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.border, opacity: pressed ? 0.78 : 1 }]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  value: { maxWidth: 96, textAlign: 'right' },
});
