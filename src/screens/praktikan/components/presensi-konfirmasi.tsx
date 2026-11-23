/**
 * Sheet konfirmasi presensi (PRD 7.1, FR-ATT-04): ringkasan sesi dan lokasi.
 * Tidak ada penulisan sebelum praktikan menekan "Ya, presensi sekarang".
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { formatRentangWIB, formatTanggal } from '@/screens/praktikan/format';
import { formatMeter, type SesiPresensiTampil, type UkuranLokasi } from '@/screens/praktikan/presensi-model';
import { typography, useTheme } from '@/theme';

interface Props {
  visible: boolean;
  sesi: SesiPresensiTampil;
  ukuran: UkuranLokasi;
  onKonfirmasi: () => void;
  onBatal: () => void;
}

export function PresensiKonfirmasi({ visible, sesi, ukuran, onKonfirmasi, onBatal }: Props) {
  const theme = useTheme();
  const lab = sesi.laboratorium ?? 'laboratorium';

  const posisi: string[] = [];
  if (ukuran.distanceMeters !== null) posisi.push(`${formatMeter(ukuran.distanceMeters)} dari ${lab}`);
  if (ukuran.accuracyMeters !== null) posisi.push(`akurasi ±${formatMeter(ukuran.accuracyMeters)}`);

  return (
    <BottomSheet visible={visible} title="Konfirmasi presensi" onClose={onBatal}>
      <View style={styles.isi}>
        <Text style={[typography.label, styles.tengah, { color: theme.colors.textPrimary }]}>{sesi.judul}</Text>
        <Text style={[typography.body, styles.tengah, { color: theme.colors.textSecondary }]}>
          {formatTanggal(sesi.tanggal)}, {formatRentangWIB(sesi.waktu)}
        </Text>
        <Text style={[typography.body, styles.tengah, { color: theme.colors.textSecondary }]}>
          {sesi.ruang} · {lab}
        </Text>
        {posisi.length > 0 ? (
          <Text style={[typography.label, styles.tengah, { color: theme.colors.textPrimary }]}>
            Posisi kamu: {posisi.join(', ')}
          </Text>
        ) : null}
        <Text style={[typography.body, styles.tengah, { color: theme.colors.textSecondary }]}>
          Waktu presensi dicatat server saat kamu menekan tombol di bawah.
        </Text>
        <View style={styles.aksi}>
          <Tombol label="Ya, presensi sekarang" onPress={onKonfirmasi} />
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
