import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, spacing, TextField, useTheme } from '../../src/design';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextField
        label="Invite code"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button label="Create account" onPress={() => router.push('/(auth)/consent')} />
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
