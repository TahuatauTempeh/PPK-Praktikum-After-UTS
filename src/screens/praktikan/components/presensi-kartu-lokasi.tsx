/**
 * Kartu pemeriksaan lokasi (PRD 7.1 dan 7.7, FR-LOC-05, FR-LOC-09).
 * Setiap kondisi izin dan perangkat punya pesan dan aksi pemulihan yang bisa ditindaklanjuti.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AksiLokasi, Kelayakan, StateKelayakan } from '@/lib/attendance-rules';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { formatMeter, type UkuranLokasi } from '@/screens/praktikan/presensi-model';
import { typography, useTheme } from '@/theme';

const PESAN: Partial<Record<StateKelayakan, string>> = {
  'checking-permission': 'Memeriksa izin lokasi.',
  'permission-needed': 'Izin lokasi diperlukan untuk memastikan kamu berada di laboratorium.',
  'permission-denied': 'Izin lokasi diperlukan untuk memastikan kamu berada di laboratorium.',
  'permission-blocked': 'Izin lokasi diblokir. Buka pengaturan perangkat untuk mengizinkannya, lalu periksa lagi.',
  'services-disabled': 'Layanan lokasi nonaktif. Aktifkan lokasi perangkat, lalu periksa lagi.',
  locating: 'Mencari lokasi kamu. Ini bisa memakan waktu hingga 15 detik.',
  'location-unavailable': 'Lokasi belum tersedia. Coba lagi di area terbuka.',
  'mock-location': 'Lokasi palsu terdeteksi. Matikan aplikasi pengubah lokasi, lalu periksa lagi.',
  'low-accuracy': 'Akurasi lokasi rendah. Tunggu sebentar lalu coba lagi.',
  eligible: 'Kamu berada di area absen.',
};

const LABEL_AKSI: Record<AksiLokasi, string> = {
  izinkan: 'Izinkan lokasi',
  'izinkan-lagi': 'Coba izinkan lagi',
  'buka-pengaturan': 'Buka pengaturan',
  'buka-pengaturan-lokasi': 'Buka pengaturan lokasi',
  'periksa-lagi': 'Periksa lokasi lagi',
};

interface Props {
  kelayakan: Kelayakan;
  ukuran: UkuranLokasi;
  onAksi: (aksi: AksiLokasi) => void;
}

export function PresensiKartuLokasi({ kelayakan, ukuran, onAksi }: Props) {
  const theme = useTheme();
  const { state, aksi } = kelayakan;

  const pesan = PESAN[state] ?? kelayakan.alasan;

  const angka: { label: string; nilai: string }[] = [];
  if (ukuran.distanceMeters !== null) angka.push({ label: 'Jarak ke lab', nilai: formatMeter(ukuran.distanceMeters) });
  if (ukuran.accuracyMeters !== null) angka.push({ label: 'Akurasi', nilai: `±${formatMeter(ukuran.accuracyMeters)}` });

  // Setelah membuka pengaturan, praktikan perlu cara memeriksa ulang tanpa keluar halaman.
  const perluPeriksaLagi = aksi === 'buka-pengaturan' || aksi === 'buka-pengaturan-lokasi';
  const masalah = state !== 'eligible' && state !== 'locating' && state !== 'checking-permission';

  return (
    <View style={[styles.kartu, { backgroundColor: theme.colors.glassCard, borderColor: theme.colors.glassBorder }]}>
      <View style={styles.teks}>
        <Text accessibilityRole="header" style={[typography.sectionTitle, { color: theme.colors.textPrimary }]}>
          Pemeriksaan lokasi
        </Text>
        {masalah ? null : (
          <Text accessibilityLiveRegion="polite" style={[typography.body, { color: theme.colors.textSecondary }]}>
            {pesan}
          </Text>
        )}
      </View>

      {/* error di atas errorSoft adalah pasangan yang sudah lolos audit kontras DESIGN.md 9 */}
      {masalah ? (
        <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme.colors.errorSoft }]}>
          <Text style={[typography.body, { color: theme.colors.error }]}>{pesan}</Text>
        </View>
      ) : null}

      {angka.length > 0 ? (
        <View style={styles.angka}>
          {angka.map((item) => (
            <View key={item.label} style={[styles.sel, { backgroundColor: theme.colors.softSurface }]}>
              <Text style={[typography.tiny, { color: theme.colors.textSecondary }]}>{item.label}</Text>
              <Text style={[typography.label, { color: theme.colors.textPrimary }]}>{item.nilai}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {aksi ? (
        <View style={styles.aksi}>
          <Tombol
            label={LABEL_AKSI[aksi]}
            varian={aksi === 'periksa-lagi' ? 'lembut' : 'utama'}
            onPress={() => onAksi(aksi)}
          />
          {perluPeriksaLagi ? <Tombol label="Periksa lagi" varian="lembut" onPress={() => onAksi('periksa-lagi')} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 16 },
  teks: { gap: 4 },
  notice: { borderRadius: 16, padding: 14 },
  angka: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sel: { flexGrow: 1, flexBasis: 90, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  aksi: { gap: 10 },
});
