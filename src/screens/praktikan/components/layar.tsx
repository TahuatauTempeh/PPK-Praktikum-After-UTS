/**
 * Layar: kerangka halaman praktikan. Latar gradien, konten digulir dengan lebar maksimum 600.
 * `sembunyikan` menyembunyikan konten dari pembaca layar saat sheet terbuka; `overlay` (sheet)
 * dirender di luar bagian yang disembunyikan.
 *
 * Area aman atas tetap dihormati: area gulir berhenti di bawah status bar, lalu konten diberi
 * jarak desain 14 px. Bottom bar mengapung, jadi padding bawah ikut tinggi bar dari context.
 */

import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTabBarInset } from '@/context/tab-bar-inset';
import { Latar } from '@/screens/praktikan/components/latar';
import { contentWidth, useTheme } from '@/theme';

interface LayarProps {
  footer?: ReactNode;
  overlay?: ReactNode;
  sembunyikan?: boolean;
  edges?: readonly Edge[];
}

export function Layar({
  children,
  footer,
  overlay,
  sembunyikan = false,
  edges = ['top', 'left', 'right'],
}: PropsWithChildren<LayarProps>) {
  const theme = useTheme();
  const tabBarInset = useTabBarInset();
  // bagian atas halaman selalu biru tua, jadi ikon status bar harus terang; hanya saat layar ini aktif
  const fokus = useIsFocused();

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: theme.colors.background }]} edges={edges}>
      {fokus ? <StatusBar style="light" /> : null}
      <Latar />
      <View
        style={styles.area}
        aria-hidden={sembunyikan}
        importantForAccessibility={sembunyikan ? 'no-hide-descendants' : 'auto'}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.gulir}>
          <View style={[styles.isi, { paddingBottom: 24 + tabBarInset }]}>{children}</View>
        </ScrollView>
        {footer}
      </View>
      {overlay}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1 },
  gulir: { flexGrow: 1, alignItems: 'center' },
  isi: {
    width: '100%',
    maxWidth: contentWidth,
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 18,
  },
});
