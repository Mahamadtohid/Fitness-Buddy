import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Card,
  spacing,
  Typography,
  useTheme,
  type AccentTone,
  type ThemePreference,
} from '../src/design';
import { UnitsSection } from '../src/features/profile/components/UnitsSection';
import { SettingsRow } from '../src/features/profile/components/SettingsRow';
import { accentTones } from '../src/design/tokens';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

const ACCENTS: { value: AccentTone; label: string }[] = [
  { value: 'emerald', label: 'Emerald' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'coral', label: 'Coral' },
];

export default function AppearanceScreen() {
  const { colors, mode, preference, setPreference, accentTone, setAccentTone } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={String(colors.textPrimary)} />
        </Pressable>
        <Typography variant="title">Appearance</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Typography variant="title">Theme</Typography>
          <View style={styles.themeGrid}>
            {THEME_OPTIONS.map((option) => {
              const selected = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setPreference(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.themeOption, { backgroundColor: selected ? colors.accentFill : colors.surfaceAlt, borderColor: selected ? colors.accent : colors.border }]}
                >
                  <Ionicons name={option.icon} size={24} color={String(selected ? colors.accentOn : colors.accent)} />
                  <Typography variant="caption" style={{ color: selected ? colors.accentOn : colors.textPrimary }}>{option.label}</Typography>
                  {selected ? <View style={[styles.check, { backgroundColor: colors.accentOn }]}><Ionicons name="checkmark" size={12} color={String(colors.accentFill)} /></View> : null}
                </Pressable>
              );
            })}
          </View>
          <Typography variant="caption" color="secondary">
            {mode === 'dark' ? 'Dark surfaces keep your training data easy to scan at night.' : 'Light surfaces keep your training data crisp in bright rooms.'}
          </Typography>
        </Card>

        <Card style={styles.card}>
          <Typography variant="title">Accent color</Typography>
          <View style={styles.accentRow}>
            {ACCENTS.map((option) => {
              const selected = accentTone === option.value;
              const toneColor = accentTones[option.value][mode].accent;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setAccentTone(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} accent`}
                  accessibilityState={{ selected }}
                  style={[styles.accentButton, { backgroundColor: toneColor, borderColor: selected ? colors.textPrimary : 'transparent' }]}
                >
                  {selected ? <Ionicons name="checkmark" size={20} color="#FFFFFF" /> : null}
                </Pressable>
              );
            })}
          </View>
          <Typography variant="caption" color="secondary">Your accent updates buttons, icons, and active states across FitTrack.</Typography>
        </Card>

        <Card style={styles.card}>
          <Typography variant="title">Display</Typography>
          <SettingsRow icon="text-outline" label="Font size" value="Medium" onPress={() => {}} />
          <SettingsRow icon="language-outline" label="Language" value="English" onPress={() => {}} />
          <UnitsSection />
        </Card>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSpacer: { width: 24 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, gap: spacing.md },
  card: { gap: spacing.md },
  themeGrid: { flexDirection: 'row', gap: spacing.sm },
  themeOption: { flex: 1, minHeight: 108, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, position: 'relative' },
  check: { position: 'absolute', right: 8, bottom: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  accentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accentButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
