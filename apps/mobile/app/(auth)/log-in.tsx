import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, spacing, TextField, Typography, useTheme } from '../../src/design';

export default function LogInScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button label="Log in" onPress={() => router.replace('/(tabs)')} />
      <Typography
        variant="body"
        color="accent"
        onPress={() => router.push('/(auth)/forgot-password')}
      >
        Forgot password?
      </Typography>
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
