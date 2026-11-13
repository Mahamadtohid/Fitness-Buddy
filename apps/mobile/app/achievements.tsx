import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, radius, screenPadding, spacing, Typography, useTheme } from '../src/design';
import { getWorkoutStreak } from '../src/data/repositories/workoutSessionRepository';
import { getAchievementProgress, type AchievementId, type AchievementProgress } from '../src/domain/streak';

const BADGE_ICONS: Record<AchievementId, React.ComponentProps<typeof Ionicons>['name']> = {
  'first-workout': 'barbell-outline',
  'three-day-streak': 'flame-outline',
  'seven-day-streak': 'calendar-outline',
  'fourteen-day-streak': 'flash-outline',
  'thirty-day-streak': 'trophy-outline',
  'hundred-workouts': 'ribbon-outline',
};

function BadgeCard({ badge }: { badge: AchievementProgress }) {
  const { colors } = useTheme();

  return (
    <Card style={[styles.badgeCard, { opacity: badge.unlocked ? 1 : 0.62 }]}>
      <View style={[styles.badgeIcon, { backgroundColor: badge.unlocked ? colors.accentFill : colors.surfaceAlt }]}>
        <Ionicons
          name={badge.unlocked ? BADGE_ICONS[badge.id] : 'lock-closed-outline'}
          size={26}
          color={String(badge.unlocked ? colors.accentOn : colors.textSecondary)}
        />
      </View>
      <View style={styles.badgeCopy}>
        <View style={styles.badgeTitleRow}>
          <Typography variant="bodyStrong">{badge.title}</Typography>
          {badge.unlocked ? <Ionicons name="checkmark-circle" size={18} color={String(colors.accent)} /> : null}
        </View>
        <Typography variant="caption" color="secondary">{badge.description}</Typography>
        <Typography variant="caption" color={badge.unlocked ? 'accent' : 'secondary'}>
          {badge.unlocked ? 'Unlocked' : `${badge.value}/${badge.target}`}
        </Typography>
      </View>
    </Card>
  );
}

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const [summary, setSummary] = useState(() => getWorkoutStreak());
  useFocusEffect(useCallback(() => {
    setSummary(getWorkoutStreak());
  }, []));

  const badges = getAchievementProgress(summary);
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={String(colors.textPrimary)} />
        </Pressable>
        <Typography variant="title">Achievements</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <Card style={[styles.hero, { borderColor: colors.accent }]}>
        <View style={[styles.heroIcon, { backgroundColor: colors.accentFill }]}>
          <Ionicons name="flame" size={30} color={String(colors.accentOn)} />
        </View>
        <Typography variant="statLarge">{summary.currentStreak}</Typography>
        <Typography variant="bodyStrong">day streak</Typography>
        <Typography variant="caption" color="secondary">
          Best: {summary.longestStreak} days · {unlockedCount}/{badges.length} badges unlocked
        </Typography>
        <Typography variant="caption" color="secondary">Sundays are recovery days and never break your streak.</Typography>
      </Card>

      <Typography variant="title">Your badges</Typography>
      {badges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: screenPadding, gap: spacing.md },
  header: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 24 },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  heroIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  badgeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  badgeIcon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  badgeCopy: { flex: 1, gap: 2 },
  badgeTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
