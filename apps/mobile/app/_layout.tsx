import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from '../src/design';
import { useAuthStore } from '../src/features/account/useAuthStore';
import { getProfile } from '../src/data/repositories/profileRepository';

function LoadingScreen() {
  const { colors } = useTheme();
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'idle') return;
    const inAuthGroup = segments[0] === '(auth)';
    const onOnboarding = segments[0] === 'onboarding';
    // Reachable regardless of auth status (PRD §7.9: "a privacy policy reachable in-app" — from
    // consent during sign-up, and from Settings once logged in) — never bounced by the gating
    // below.
    const onPrivacyPolicy = segments[0] === 'privacy-policy';

    if (status === 'unauthenticated' && !inAuthGroup && !onPrivacyPolicy) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (status === 'authenticated') {
      // Authenticated but no local profile yet (first sign-in on this device, or a brand-new
      // account) — onboarding captures it before any tab screen that assumes one exists.
      const hasProfile = getProfile() !== null;
      if (!hasProfile && !onOnboarding) {
        router.replace('/onboarding');
      } else if (hasProfile && (inAuthGroup || onOnboarding)) {
        router.replace('/(tabs)');
      }
    }
  }, [status, segments, router]);

  if (status === 'idle') {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" options={{ headerShown: true, title: 'Set up your profile' }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: true, title: 'Privacy Policy' }} />
      <Stack.Screen name="quick-add" options={{ presentation: 'modal', headerShown: true, title: 'Quick add' }} />
      <Stack.Screen name="active-workout" options={{ headerShown: true, title: 'Workout' }} />
      <Stack.Screen name="exercise-library" options={{ headerShown: true, title: 'Exercises' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </ThemeProvider>
  );
}
