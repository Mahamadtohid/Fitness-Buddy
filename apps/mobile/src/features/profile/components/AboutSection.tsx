import { Linking, StyleSheet } from 'react-native';

import { Card, spacing, Typography } from '../../../design';

const REPDB_URL = 'https://repdb.co';

/**
 * Credits. The RepDB link is not optional decoration: their free-tier licence requires a visible
 * "Exercise data by RepDB (repdb.co)" credit wherever their data is used in an app, and the
 * exercise guides on the exercise detail screen are derived from it.
 */
export function AboutSection() {
  return (
    <Card style={styles.card}>
      <Typography variant="title">About</Typography>
      <Typography variant="body" color="secondary">
        FitTrack — Train. Fuel. Progress.
      </Typography>
      <Typography variant="body">
        Exercise data by{' '}
        <Typography
          variant="body"
          color="accent"
          accessibilityRole="link"
          onPress={() => void Linking.openURL(REPDB_URL)}
        >
          RepDB (repdb.co)
        </Typography>
      </Typography>
      <Typography variant="caption" color="secondary">
        Exercise guidance is informational and not medical advice. Consult a physician before
        starting any exercise program.
      </Typography>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
});
