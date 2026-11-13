/**
 * Jadwal Asisten — Placeholder screen.
 * Akan diimplementasi oleh Programmer 3 (UC-06, UC-07, UC-08, UC-09, UC-11).
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/use-theme';

export default function JadwalAsistenScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <EmptyState
        icon="🚧"
        title="Halaman Jadwal Asisten"
        subtitle="Akan diimplementasi oleh Programmer 3 — Kelola sesi, buka/tutup presensi, dan tambah sesi baru."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
