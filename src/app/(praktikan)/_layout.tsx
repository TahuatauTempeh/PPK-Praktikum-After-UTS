/**
 * Praktikan Tab Layout — Navigasi tab untuk sisi praktikan.
 * Tab: Jadwal, Riwayat, Izin, Peta, Profil
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { Text, useWindowDimensions } from 'react-native';

import { TAB_TRANSITION_SPEC, tabSlideInterpolator } from '@/constants/tab-transition';
import { BlurTargetProvider } from '@/context/blur-target';
import { TabBarInsetProvider } from '@/context/tab-bar-inset';
import { NavigasiPraktikan } from '@/screens/praktikan/components/navigasi';
import { useTheme } from '@/theme';

export default function PraktikanLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  return (
    <TabBarInsetProvider>
      <BlurTargetProvider>
        <Tabs
          tabBar={(props) => <NavigasiPraktikan {...props} />}
          screenOptions={{
            sceneStyle: { backgroundColor: theme.colors.background },
            transitionSpec: TAB_TRANSITION_SPEC,
            sceneStyleInterpolator: tabSlideInterpolator(width),
            tabBarStyle: {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textSecondary,
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
            name="izin"
            options={{
              title: 'Izin',
              headerShown: false,
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📝</Text>,
            }}
          />
          <Tabs.Screen
            name="peta"
            options={{
              title: 'Peta',
              headerShown: false,
              tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📍</Text>,
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
      </BlurTargetProvider>
    </TabBarInsetProvider>
  );
}
