import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, spacing, Typography, useTheme } from '../src/design';

type Section = { title: string; body: string };

const SECTIONS: Section[] = [
  {
    title: 'What we collect',
    body:
      "Your account email and password (password is never stored in plain text). Health-related " +
      "data you choose to log: body weight, workouts and sets, food and water entries, body " +
      "measurements, and the weekly check-in you accept, edit or skip. Progress photos you add are " +
      "stored only on this device and are never uploaded, synced, or included in a data export.",
  },
  {
    title: 'Why we collect it',
    body:
      "Solely to provide the app's core functionality: calculating your targets, tracking your " +
      "training and nutrition, showing your trend over time, and keeping your data available if " +
      "you sign in on a second device. Nothing here is used for advertising.",
  },
  {
    title: "What we don't do",
    body:
      "No ads. No selling or sharing your data with third parties. No product analytics tracking " +
      "your behavior. We use a crash/error reporting tool to help fix bugs, with personal data " +
      "scrubbed from those reports before they leave your device.",
  },
  {
    title: 'How long we keep it',
    body:
      "For as long as your account exists. You can export a full copy of your data at any time " +
      "from Settings. Deleting your account (also in Settings) permanently removes every record " +
      "tied to it from our servers, and wipes the copy stored on this device - this cannot be " +
      "undone.",
  },
  {
    title: 'Your rights',
    body:
      "You can view, export and delete your data yourself, in-app, at any time - no need to " +
      "contact anyone to exercise these rights. If you have a question this policy doesn't " +
      "answer, reach out to the contact listed below.",
  },
  {
    title: 'Contact',
    body: 'privacy@example.com (placeholder - replace with a real contact address before any public release).',
  },
];

/**
 * PRD §7.9: "a privacy policy reachable in-app and on the store listing." This is a draft written
 * to accurately describe what the app actually does as of Phase 6 - it has NOT been reviewed
 * by a lawyer and must be before any public launch, per PRD §7.9's own note on reviewing
 * obligations under India's DPDP Act. The banner below is deliberate, not a placeholder to delete.
 */
export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Card style={[styles.banner, { borderColor: colors.danger }]}>
        <Typography variant="bodyStrong" color="danger">
          Draft - not legal advice
        </Typography>
        <Typography variant="caption" color="secondary">
          This policy accurately describes what the app does today, but has not been reviewed by a
          lawyer and must be before any public release, including any review required under
          India&apos;s Digital Personal Data Protection Act.
        </Typography>
      </Card>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Typography variant="title">{section.title}</Typography>
          <Typography variant="body" color="secondary">
            {section.body}
          </Typography>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  banner: {
    gap: spacing.xs,
    borderWidth: 1,
  },
  section: {
    gap: spacing.xs,
  },
});
