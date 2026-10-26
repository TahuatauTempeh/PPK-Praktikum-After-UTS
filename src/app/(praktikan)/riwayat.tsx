/**
 * Riwayat Kehadiran — Placeholder screen.
 * Akan diimplementasi oleh Programmer 2 (UC-05).
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/use-theme';

export default function RiwayatScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <EmptyState
        icon="🚧"
        title="Halaman Riwayat Kehadiran"
        subtitle="Akan diimplementasi oleh Programmer 2 — Lihat catatan kehadiran Anda."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
