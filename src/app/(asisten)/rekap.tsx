/**
 * Rekap — Placeholder screen.
 * Akan diimplementasi oleh Programmer 3 (UC-10).
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/use-theme';

export default function RekapScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <EmptyState
        icon="🚧"
        title="Halaman Rekap"
        subtitle="Akan diimplementasi oleh Programmer 3 — Lihat rekap kehadiran per sesi."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
