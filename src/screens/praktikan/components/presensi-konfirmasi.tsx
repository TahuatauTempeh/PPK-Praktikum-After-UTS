/**
 * Sheet konfirmasi presensi (PRD 7.1, FR-ATT-04): dialog singkat tanpa detail sesi.
 * Tidak ada penulisan sebelum praktikan menekan "Ya".
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { typography, useTheme } from '@/theme';

interface Props {
  visible: boolean;
  onKonfirmasi: () => void;
  onBatal: () => void;
}

export function PresensiKonfirmasi({ visible, onKonfirmasi, onBatal }: Props) {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible} title="Konfirmasi presensi" onClose={onBatal}>
      <View style={styles.isi}>
        <Text style={[typography.body, styles.tengah, { color: theme.colors.textSecondary }]}>
          Apakah kamu yakin ingin presensi sekarang?
        </Text>
        <View style={styles.aksi}>
          <Tombol label="Ya" onPress={onKonfirmasi} />
          <Tombol label="Batal" varian="lembut" onPress={onBatal} />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  isi: { gap: 8 },
  tengah: { textAlign: 'center' },
  aksi: { gap: 10, marginTop: 8 },
});
