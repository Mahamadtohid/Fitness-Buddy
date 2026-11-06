import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, spacing, TextField, Typography, useTheme } from '../../src/design';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Typography variant="body" color="secondary">
        We will email you a link to reset your password.
      </Typography>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button label="Send reset link" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
