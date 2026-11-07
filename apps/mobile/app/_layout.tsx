import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider } from '../src/design';
import { useAuthStore } from '../src/features/account/useAuthStore';
import { getProfile } from '../src/data/repositories/profileRepository';
import { AppLockGate } from '../src/features/security/components/AppLockGate';
import { useAppLockStore } from '../src/features/security/useAppLockStore';

// Keeps the native splash (the same branded image, configured in app.json's expo-splash-screen
// plugin) on screen through the auth bootstrap below, instead of it auto-hiding on first frame and
// leaving a blank gap before the app knows whether to show the tabs or the welcome screen.
void SplashScreen.preventAutoHideAsync().catch(() => {});

// Shown only if bootstrap somehow outlasts the native splash — the same full-bleed branded image,
// so there's no visible seam between the native splash and this JS fallback.
function LoadingScreen() {
  return (
    <Image
      source={require('../assets/splash-background.png')}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    />
  );
}

function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const bootstrapAppLock = useAppLockStore((s) => s.bootstrap);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    void bootstrapAppLock();
  }, [bootstrapAppLock]);

  useEffect(() => {
    if (status !== 'idle') {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [status]);

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
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" options={{ headerShown: true, title: 'Set up your profile' }} />
        <Stack.Screen name="privacy-policy" options={{ headerShown: true, title: 'Privacy Policy' }} />
        <Stack.Screen name="quick-add" options={{ presentation: 'modal', headerShown: true, title: 'Quick add' }} />
        <Stack.Screen name="active-workout" options={{ headerShown: true, title: 'Workout' }} />
        <Stack.Screen name="exercise-library" options={{ headerShown: true, title: 'Exercises' }} />
        <Stack.Screen name="exercise/[exerciseId]" options={{ headerShown: true, title: 'Exercise history' }} />
      </Stack>
      {status === 'authenticated' ? <AppLockGate /> : null}
    </>
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
