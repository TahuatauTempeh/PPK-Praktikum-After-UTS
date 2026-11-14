/**
 * Praktikan Tab Layout — Navigasi tab untuk sisi praktikan.
 * Tab: Jadwal, Riwayat, Profil
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { Text, useWindowDimensions } from 'react-native';

import { TAB_TRANSITION_SPEC, tabSlideInterpolator } from '@/constants/tab-transition';
import { useTheme } from '@/hooks/use-theme';
import { NavigasiPraktikan } from '@/screens/praktikan/components/navigasi';

export default function PraktikanLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  return (
    <Tabs
      tabBar={(props) => <NavigasiPraktikan {...props} />}
      screenOptions={{
        sceneStyle: { backgroundColor: theme.background },
        transitionSpec: TAB_TRANSITION_SPEC,
        sceneStyleInterpolator: tabSlideInterpolator(width),
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jadwal',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="riwayat"
        options={{
          title: 'Riwayat',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
