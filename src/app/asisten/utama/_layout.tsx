/**
 * Asisten Tab Layout — Navigasi tab untuk sisi asisten.
 * Tab: Jadwal, Rekap, Profil
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export default function AsistenLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.success,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jadwal',
          href: '/asisten/utama',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="rekap"
        options={{
          title: 'Rekap',
          href: '/asisten/utama/rekap',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          href: '/asisten/utama/profil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
