/**
 * Kartu identitas sesi di halaman presensi (PRD 7.1, FR-ATT-02).
 * Pola kartu dan daftar rincian mengikuti Detail Sesi supaya kedua halaman terasa satu alur.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ikon, type IkonNama } from '@/screens/praktikan/components/ikon';
import { KilauKaca } from '@/screens/praktikan/components/latar';
import { StatusLabel } from '@/screens/praktikan/components/status-label';
import { formatRentangWIB, formatTanggal, formatTanggalPendek } from '@/screens/praktikan/format';
import type { SesiPresensiTampil } from '@/screens/praktikan/presensi-model';
import { fonts, typography, useTheme } from '@/theme';

export function PresensiKartuSesi({ sesi }: { sesi: SesiPresensiTampil }) {
  const theme = useTheme();
  const lokasi = sesi.laboratorium ? `${sesi.ruang} · ${sesi.laboratorium}` : `${sesi.ruang} · Laboratorium belum diatur`;

  const rincian: { ikon: IkonNama; label: string; nilai: string }[] = [
    { ikon: 'jadwal', label: 'Tanggal', nilai: formatTanggal(sesi.tanggal) },
    { ikon: 'jam', label: 'Waktu', nilai: formatRentangWIB(sesi.waktu) },
    { ikon: 'lokasi', label: 'Ruang dan laboratorium', nilai: lokasi },
  ];
  if (sesi.asisten) rincian.push({ ikon: 'profil', label: 'Asisten', nilai: sesi.asisten });

  return (
    <>
      <View
        style={[
          styles.kartuUtama,
          { backgroundColor: theme.colors.cardOpen, borderColor: theme.colors.glassBorder, boxShadow: theme.colors.shadow },
        ]}
      >
        <KilauKaca />
        <View style={styles.baris}>
          <Text style={[typography.tiny, styles.tanggal, { color: theme.colors.textSecondary }]}>
            {formatTanggalPendek(sesi.tanggal).toUpperCase()}
          </Text>
          <StatusLabel status={sesi.status} />
        </View>
        <View style={styles.materi}>
          <Text accessibilityRole="header" style={[typography.detailTitle, { color: theme.colors.textPrimary }]}>
            {sesi.judul}
          </Text>
          {sesi.kelas ? (
            <Text style={[typography.body, { color: theme.colors.textSecondary }]}>Kelas {sesi.kelas}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.daftar, { backgroundColor: theme.colors.glassCard, borderColor: theme.colors.glassBorder }]}>
        {rincian.map((item, index) => (
          <View
            key={item.label}
            style={[styles.rincian, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.hairline }]}
          >
            <View style={[styles.ikonBulat, { backgroundColor: theme.colors.softSurface }]}>
              <Ikon nama={item.ikon} ukuran={18} warna={theme.colors.primary} />
            </View>
            <View style={styles.teksRincian}>
              <Text style={[typography.tiny, { color: theme.colors.textSecondary }]}>{item.label}</Text>
              <Text style={[typography.label, { color: theme.colors.textPrimary }]}>{item.nilai}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  kartuUtama: { overflow: 'hidden', padding: 20, gap: 14, borderRadius: 28, borderWidth: 1 },
  baris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tanggal: { fontFamily: fonts.semibold, letterSpacing: 0.6 },
  materi: { gap: 6 },
  daftar: { borderRadius: 24, borderWidth: 1, paddingHorizontal: 16 },
  rincian: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  ikonBulat: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  teksRincian: { flex: 1, gap: 2 },
});
