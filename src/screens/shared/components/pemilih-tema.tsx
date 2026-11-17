/**
 * Pemilih tema tiga bagian: ikuti sistem, terang, gelap.
 * Berbentuk pil ikon dan menggantikan switch "Mode gelap" beserta tautan
 * "Ikuti pengaturan perangkat" di halaman Profil. Ikon memakai pustaka
 * `expo-symbols`: SF Symbols di iOS, Material Symbols di Android dan web.
 *
 * Penanda aktif berupa satu lingkaran yang bergeser di belakang ikon, memakai
 * durasi dan easing yang sama dengan indikator bottom tab.
 */

import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

import { INDICATOR_SLIDE } from '@/constants/tab-transition';
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

/** Ukuran segmen dan jarak antar segmen; dipakai juga untuk menghitung geseran. */
const SEGMEN = 40;
const JARAK = 2;
const PADDING = 4;
const LANGKAH = SEGMEN + JARAK;

type Props = {
  nilai: ThemeMode;
  onPilih: (mode: ThemeMode) => void;
};

export function PemilihTema({ nilai, onPilih }: Props) {
  const theme = useTheme();
  const indeks = Math.max(
    0,
    PILIHAN.findIndex((pilihan) => pilihan.mode === nilai)
  );
  // Nilai awal langsung di posisi aktif supaya indikator tidak meluncur masuk
  // saat halaman Profil pertama kali dibuka.
  const [geser] = useState(() => new Animated.Value(indeks * LANGKAH));

  useEffect(() => {
    const animasi = Animated.timing(geser, {
      toValue: indeks * LANGKAH,
      ...INDICATOR_SLIDE,
      useNativeDriver: Platform.OS !== 'web',
    });
    animasi.start();
    return () => animasi.stop();
  }, [geser, indeks]);

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Tema"
      accessibilityHint="Mengganti tema seluruh halaman aplikasi."
      style={[styles.track, { backgroundColor: theme.colors.softSurface }]}
    >
      <Animated.View
        pointerEvents="none"
        accessible={false}
        style={[
          styles.indikator,
          { backgroundColor: theme.colors.primaryFill, transform: [{ translateX: geser }] },
        ]}
      />
      {PILIHAN.map(({ mode, simbol, label }, posisi) => {
        const aktif = posisi === indeks;
        return (
          <Pressable
            key={mode}
            accessibilityRole="radio"
            accessibilityLabel={`Tema ${label.toLowerCase()}`}
            accessibilityState={{ checked: aktif }}
            hitSlop={4}
            onPress={() => onPilih(mode)}
            style={({ pressed }) => [styles.segmen, pressed && styles.ditekan]}
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
    gap: JARAK,
    padding: PADDING,
    borderRadius: 999,
  },
  indikator: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    width: SEGMEN,
    height: SEGMEN,
    borderRadius: 999,
  },
  segmen: {
    width: SEGMEN,
    height: SEGMEN,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  ditekan: {
    opacity: 0.7,
  },
});
