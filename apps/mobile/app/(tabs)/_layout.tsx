import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { QuickAddButton } from '../../src/design/components/QuickAddButton';
import { useTheme } from '../../src/design';
import { initSync } from '../../src/data/sync';
import { seedStarterTemplatesIfEmpty } from '../../src/data/repositories/workoutTemplateRepository';

export default function TabsLayout() {
  const { colors } = useTheme();

  useEffect(() => {
    seedStarterTemplatesIfEmpty();
    initSync();
  }, []);

  return (
    <View style={styles.flex}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Today' }} />
        <Tabs.Screen name="train" options={{ title: 'Train' }} />
        <Tabs.Screen name="food" options={{ title: 'Food' }} />
        <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
      <QuickAddButton />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
