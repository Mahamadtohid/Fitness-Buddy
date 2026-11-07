import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { QuickAddButton } from '../../src/design/components/QuickAddButton';
import { useTheme } from '../../src/design';
import { initSync } from '../../src/data/sync';
import { seedStarterTemplatesIfEmpty } from '../../src/data/repositories/workoutTemplateRepository';

const ICON_SIZE = 22;

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
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'today' : 'today-outline'} size={ICON_SIZE} color={String(color)} />
            ),
          }}
        />
        <Tabs.Screen
          name="train"
          options={{
            title: 'Train',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="dumbbell" size={ICON_SIZE} color={String(color)} />,
          }}
        />
        <Tabs.Screen
          name="food"
          options={{
            title: 'Food',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={ICON_SIZE} color={String(color)} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={ICON_SIZE} color={String(color)} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={ICON_SIZE} color={String(color)} />
            ),
          }}
        />
      </Tabs>
      <QuickAddButton />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
