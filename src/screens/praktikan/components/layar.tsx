/**
 * Layar: kerangka halaman praktikan. Latar gradien, konten digulir dengan lebar maksimum 600.
 * `sembunyikan` menyembunyikan konten dari pembaca layar saat sheet terbuka; `overlay` (sheet)
 * dirender di luar bagian yang disembunyikan.
 */

import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { Latar } from '@/screens/praktikan/components/latar';
import { LebarKonten, usePraktikanTheme } from '@/screens/praktikan/theme';

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
  const theme = usePraktikanTheme();
  // bagian atas halaman selalu biru tua, jadi ikon status bar harus terang; hanya saat layar ini aktif
  const fokus = useIsFocused();

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: theme.background }]} edges={edges}>
      {fokus ? <StatusBar style="light" /> : null}
      <Latar />
      <View
        style={styles.area}
        aria-hidden={sembunyikan}
        importantForAccessibility={sembunyikan ? 'no-hide-descendants' : 'auto'}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.gulir}>
          <View style={styles.isi}>{children}</View>
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
    maxWidth: LebarKonten,
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 18,
  },
});
