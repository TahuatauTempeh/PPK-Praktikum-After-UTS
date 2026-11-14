/**
 * SesiCard: kartu sesi di jadwal praktikan (DESIGN.md bagian 9).
 * Kartu sesi yang sedang dibuka diberi kilau kaca. Status kehadiran milik user ditampilkan
 * sebagai teks, kecuali sesi belum dibuka.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ikon } from '@/screens/praktikan/components/ikon';
import { KilauKaca } from '@/screens/praktikan/components/latar';
import { StatusLabel } from '@/screens/praktikan/components/status-label';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { formatJamWIB, formatRentangWIB, formatTanggal } from '@/screens/praktikan/format';
import { pecahJudul } from '@/screens/praktikan/selectors';
import { fonts, typography, useTheme } from '@/theme';
import { AttendanceRecord, Session } from '@/types';

interface SesiCardProps {
  session: Session;
  record?: AttendanceRecord;
  onPress: () => void;
}

export function SesiCard({ session, record, onPress }: SesiCardProps) {
  const theme = useTheme();
  const dibuka = session.status === 'open';
  const perluPresensi = dibuka && !record;
  const { mataKuliah, sesi } = pecahJudul(session);
  const tampilKehadiran = session.status !== 'scheduled';

  return (
    <View
      style={[
        styles.kartu,
        {
          backgroundColor: dibuka ? theme.colors.cardOpen : theme.colors.glassCard,
          borderColor: theme.colors.glassBorder,
          boxShadow: theme.colors.shadow,
        },
      ]}
    >
      {dibuka ? <KilauKaca /> : null}
      <View style={styles.isi}>
        <View style={styles.baris}>
          <Text style={[typography.eyebrow, { color: theme.colors.textSecondary }]}>PRAKTIKUM</Text>
          <StatusLabel status={session.status} />
        </View>

        <View style={styles.materi}>
          <Text accessibilityRole="header" style={[typography.cardTitle, { color: theme.colors.textPrimary }]}>
            {mataKuliah}
          </Text>
          {sesi ? <Text style={[typography.body, { color: theme.colors.textSecondary }]}>{sesi}</Text> : null}
        </View>

        <View style={styles.meta}>
          <View style={styles.barisMeta}>
            <Ikon nama="jadwal" ukuran={15} warna={theme.colors.textSecondary} />
            <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{formatTanggal(session.date)}</Text>
          </View>
          <View style={styles.barisMeta}>
            <Ikon nama="jam" ukuran={15} warna={theme.colors.textSecondary} />
            <Text style={[typography.caption, styles.tebal, { color: theme.colors.textPrimary }]}>
              {formatRentangWIB(session.time)}
            </Text>
          </View>
          <View style={styles.barisMeta}>
            <Ikon nama="lokasi" ukuran={14} warna={theme.colors.textSecondary} />
            <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{session.room}</Text>
          </View>
        </View>

        {tampilKehadiran ? (
          <View style={[styles.kehadiran, { borderTopColor: theme.colors.hairline }]}>
            {record ? (
              <Text style={[typography.caption, styles.tebal, { color: theme.colors.success }]}>
                Hadir {formatJamWIB(record.timestamp)} WIB
              </Text>
            ) : dibuka ? (
              <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>Belum presensi</Text>
            ) : (
              <View style={[styles.pil, { backgroundColor: theme.colors.softSurface }]}>
                <Text numberOfLines={1} style={[typography.caption, styles.tebal, { color: theme.colors.error }]}>
                  Tidak hadir
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <Tombol
        label={perluPresensi ? 'Presensi' : 'Lihat detail'}
        varian={perluPresensi ? 'utama' : 'polos'}
        panah
        rapat
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: { padding: 7, borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  isi: { padding: 14, gap: 14 },
  baris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  materi: { gap: 4 },
  meta: { gap: 6 },
  barisMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tebal: { fontFamily: fonts.semibold },
  kehadiran: { paddingTop: 12, borderTopWidth: 1, alignItems: 'flex-start' },
  pil: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, flexShrink: 0 },
});
