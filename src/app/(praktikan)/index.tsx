/**
 * Jadwal Praktikan — Placeholder screen.
 * Akan diimplementasi oleh Programmer 2 (UC-02, UC-03, UC-04).
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/use-theme';

export default function JadwalPraktikanScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <EmptyState
        icon="🚧"
        title="Halaman Jadwal Praktikan"
        subtitle="Akan diimplementasi oleh Programmer 2 — Lihat jadwal, detail sesi, dan lakukan presensi."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
