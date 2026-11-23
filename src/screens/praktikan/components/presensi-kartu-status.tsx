/**
 * Kartu status presensi (PRD 7.1, 8.2, FR-ATT-06, FR-ATT-07, FR-ATT-11).
 * Sukses hanya tampil dari respons server atau listener, tidak pernah optimistis (BR-12).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SessionStatus } from '@/types';
import { formatMeter, type CatatanPresensi, type StatusKirim } from '@/screens/praktikan/presensi-model';
import { typography, useTheme } from '@/theme';

interface Props {
  status: SessionStatus;
  catatan: CatatanPresensi | null;
  kirim: StatusKirim;
  laboratorium: string | null;
}

type Bentuk = 'aksen' | 'sukses' | 'netral';

export function PresensiKartuStatus({ status, catatan, kirim, laboratorium }: Props) {
  const theme = useTheme();
  const lab = laboratorium ?? 'laboratorium';

  let bentuk: Bentuk;
  let judul: string;
  let jam: string | null = null;
  let keterangan: string;

  if (kirim.tahap === 'berhasil') {
    bentuk = 'sukses';
    judul = 'Presensi berhasil';
    jam = kirim.jam;
    keterangan = `Tercatat pukul ${kirim.jam} WIB · ${formatMeter(kirim.distanceMeters)} dari ${lab}`;
  } else if (catatan) {
    bentuk = 'sukses';
    judul = 'Sudah presensi';
    jam = catatan.jam;
    keterangan =
      catatan.adaBuktiLokasi && catatan.distanceMeters !== null
        ? `Tercatat ${formatMeter(catatan.distanceMeters)} dari ${lab}`
        : 'Presensi lama, tanpa bukti lokasi';
  } else if (status === 'closed') {
    bentuk = 'netral';
    judul = 'Tidak ada presensi';
    keterangan = 'Sesi sudah ditutup. Presensi tidak dapat dilakukan.';
  } else if (status === 'scheduled') {
    bentuk = 'netral';
    judul = 'Belum presensi';
    keterangan = 'Presensi bisa dilakukan setelah asisten membuka sesi.';
  } else {
    bentuk = 'aksen';
    judul = 'Belum presensi';
    keterangan = 'Kehadiran tercatat setelah lokasi kamu terverifikasi dan kamu mengonfirmasi.';
  }

  const warnaJudul =
    bentuk === 'aksen' ? theme.colors.onPrimary : bentuk === 'sukses' ? theme.colors.success : theme.colors.textPrimary;
  const warnaTeks = bentuk === 'aksen' ? theme.colors.onPrimary : theme.colors.textSecondary;

  return (
    <>
      <View
        style={[
          styles.kapsul,
          bentuk === 'aksen' && { backgroundColor: theme.colors.primaryFill },
          bentuk === 'sukses' && { backgroundColor: theme.colors.successSoft },
          bentuk === 'netral' && {
            backgroundColor: theme.colors.glassCard,
            borderWidth: 1,
            borderColor: theme.colors.glassBorder,
          },
        ]}
      >
        <Text style={[typography.caption, { color: warnaTeks }]}>Presensi kamu</Text>
        <Text accessibilityRole="header" style={[typography.sectionTitle, { color: warnaJudul }]}>
          {judul}
        </Text>
        {jam ? <Text style={[typography.timeDisplay, { color: theme.colors.success }]}>{jam} WIB</Text> : null}
        <Text style={[typography.body, { color: warnaTeks }]}>{keterangan}</Text>
      </View>

      {kirim.tahap === 'gagal' ? (
        <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme.colors.errorSoft }]}>
          <Text style={[typography.label, { color: theme.colors.error }]}>Presensi tidak tercatat</Text>
          <Text style={[typography.body, { color: theme.colors.error }]}>{kirim.pesan}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  kapsul: { borderRadius: 24, padding: 18, gap: 4 },
  notice: { borderRadius: 16, padding: 14, gap: 4 },
});
