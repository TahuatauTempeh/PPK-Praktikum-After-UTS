/**
 * Tombol: aksi sisi praktikan. Tinggi minimal 48, melewati target sentuh 44.
 * Tombol nonaktif tidak memakai opacity supaya tulisannya tetap lolos kontras.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ikon } from '@/screens/praktikan/components/ikon';
import { fonts, typography, useTheme } from '@/theme';

interface TombolProps {
  label: string;
  onPress: () => void;
  varian?: 'utama' | 'lembut' | 'terang';
  disabled?: boolean;
  panah?: boolean;
  petunjuk?: string;
}

// 'terang' dipakai di atas kartu biru, jadi warnanya tidak ikut tema
const TERANG = { latar: '#FFFFFF', teks: '#204CAC' };

export function Tombol({
  label,
  onPress,
  varian = 'utama',
  disabled = false,
  panah = false,
  petunjuk,
}: TombolProps) {
  const theme = useTheme();
  const utama = varian === 'utama' && !disabled;
  const terang = varian === 'terang' && !disabled;
  const warnaTeks = terang
    ? TERANG.teks
    : utama
      ? theme.colors.onPrimary
      : disabled
        ? theme.colors.textSecondary
        : theme.colors.primary;
  const latar = terang
    ? TERANG.latar
    : utama
      ? theme.colors.primaryFill
      : disabled
        ? theme.colors.glassCard
        : theme.colors.softSurface;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={petunjuk}
      style={({ pressed }) => [
        styles.tombol,
        {
          backgroundColor: latar,
          borderColor: theme.colors.glassBorder,
          borderWidth: disabled ? 1 : 0,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={[styles.isi, !panah && styles.tengah]}>
        <Text style={[typography.caption, styles.label, { color: warnaTeks }]}>{label}</Text>
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
  label: { fontSize: 13, fontFamily: fonts.semibold, flexShrink: 1 },
});
