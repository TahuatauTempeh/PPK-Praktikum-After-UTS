/**
 * Pemilih tema tiga bagian: ikuti sistem, terang, gelap.
 * Berbentuk pil ikon dan menggantikan switch "Mode gelap" beserta tautan
 * "Ikuti pengaturan perangkat" di halaman Profil. Ikon memakai pustaka
 * `expo-symbols`: SF Symbols di iOS, Material Symbols di Android dan web.
 */

import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { type ThemeMode } from '@/context/theme-context';
import { useTheme } from '@/theme';

type Simbol = Extract<SymbolViewProps['name'], object>;

type Pilihan = {
  mode: ThemeMode;
  simbol: Simbol;
  label: string;
};

const PILIHAN: readonly Pilihan[] = [
  {
    mode: 'system',
    simbol: { ios: 'display', android: 'monitor', web: 'monitor' },
    label: 'Ikuti sistem',
  },
  {
    mode: 'light',
    simbol: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
    label: 'Terang',
  },
  {
    mode: 'dark',
    simbol: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
    label: 'Gelap',
  },
];

type Props = {
  nilai: ThemeMode;
  onPilih: (mode: ThemeMode) => void;
};

export function PemilihTema({ nilai, onPilih }: Props) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Tema"
      accessibilityHint="Mengganti tema seluruh halaman aplikasi."
      style={[styles.track, { backgroundColor: theme.colors.softSurface }]}
    >
      {PILIHAN.map(({ mode, simbol, label }) => {
        const aktif = mode === nilai;
        return (
          <Pressable
            key={mode}
            accessibilityRole="radio"
            accessibilityLabel={`Tema ${label.toLowerCase()}`}
            accessibilityState={{ checked: aktif }}
            hitSlop={4}
            onPress={() => onPilih(mode)}
            style={({ pressed }) => [
              styles.segmen,
              aktif && { backgroundColor: theme.colors.primaryFill },
              pressed && styles.ditekan,
            ]}
          >
            <SymbolView
              name={simbol}
              size={18}
              tintColor={aktif ? theme.colors.onPrimary : theme.colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 2,
    padding: 4,
    borderRadius: 999,
  },
  segmen: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  ditekan: {
    opacity: 0.7,
  },
});
