/**
 * Tombol: aksi sisi praktikan. Tinggi minimal 48, melewati target sentuh 44.
 * Tombol nonaktif tidak memakai opacity supaya tulisannya tetap lolos kontras.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ikon } from '@/screens/praktikan/components/ikon';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

interface TombolProps {
  label: string;
  onPress: () => void;
  varian?: 'utama' | 'lembut';
  disabled?: boolean;
  panah?: boolean;
}

export function Tombol({ label, onPress, varian = 'utama', disabled = false, panah = false }: TombolProps) {
  const theme = usePraktikanTheme();
  const utama = varian === 'utama' && !disabled;
  const warnaTeks = utama ? theme.diAtasAksen : disabled ? theme.teksSekunder : theme.teksLembut;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.tombol,
        {
          backgroundColor: utama ? theme.isiAksen : disabled ? theme.kartu : theme.isiLembut,
          borderColor: theme.garisKartu,
          borderWidth: disabled ? 1 : 0,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={[styles.isi, !panah && styles.tengah]}>
        <Text style={[Tipe.caption, styles.label, { color: warnaTeks }]}>{label}</Text>
        {panah && !disabled ? <Ikon nama="panah" ukuran={18} warna={warnaTeks} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tombol: {
    minHeight: 48,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  isi: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tengah: { justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
});
