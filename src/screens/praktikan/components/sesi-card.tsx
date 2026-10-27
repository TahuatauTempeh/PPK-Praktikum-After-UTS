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
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';
import { AttendanceRecord, Session } from '@/types';

interface SesiCardProps {
  session: Session;
  record?: AttendanceRecord;
  onPress: () => void;
}

export function SesiCard({ session, record, onPress }: SesiCardProps) {
  const theme = usePraktikanTheme();
  const dibuka = session.status === 'open';
  const perluPresensi = dibuka && !record;
  const { mataKuliah, sesi } = pecahJudul(session);
  const tampilKehadiran = session.status !== 'scheduled';

  return (
    <View
      style={[
        styles.kartu,
        {
          backgroundColor: dibuka ? theme.kartuSorot : theme.kartu,
          borderColor: theme.garisKartu,
          boxShadow: theme.bayang,
        },
      ]}
    >
      {dibuka ? <KilauKaca /> : null}
      <View style={styles.isi}>
        <View style={styles.baris}>
          <Text style={[Tipe.eyebrow, { color: theme.teksSekunder }]}>PRAKTIKUM</Text>
          <StatusLabel status={session.status} />
        </View>

        <View style={styles.materi}>
          <Text accessibilityRole="header" style={[Tipe.judulKartu, { color: theme.teks }]}>
            {mataKuliah}
          </Text>
          {sesi ? <Text style={[Tipe.body, { color: theme.teksSekunder }]}>{sesi}</Text> : null}
        </View>

        <View style={styles.meta}>
          <View style={styles.barisMeta}>
            <Ikon nama="jadwal" ukuran={15} warna={theme.teksSekunder} />
            <Text style={[Tipe.caption, { color: theme.teksSekunder }]}>{formatTanggal(session.date)}</Text>
          </View>
          <View style={styles.barisMeta}>
            <Ikon nama="jam" ukuran={15} warna={theme.teksSekunder} />
            <Text style={[Tipe.caption, styles.tebal, { color: theme.teks }]}>
              {formatRentangWIB(session.time)}
            </Text>
          </View>
          <View style={styles.barisMeta}>
            <Ikon nama="lokasi" ukuran={14} warna={theme.teksSekunder} />
            <Text style={[Tipe.caption, { color: theme.teksSekunder }]}>{session.room}</Text>
          </View>
        </View>

        {tampilKehadiran ? (
          <View style={[styles.kehadiran, { borderTopColor: theme.pemisah }]}>
            {record ? (
              <Text style={[Tipe.caption, styles.tebal, { color: theme.sukses }]}>
                Hadir {formatJamWIB(record.timestamp)} WIB
              </Text>
            ) : dibuka ? (
              <Text style={[Tipe.caption, { color: theme.teksSekunder }]}>Belum presensi</Text>
            ) : (
              <View style={[styles.pil, { backgroundColor: theme.isiLembut }]}>
                <Text numberOfLines={1} style={[Tipe.caption, styles.tebal, { color: theme.galat }]}>
                  Tidak hadir
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <Tombol
        label={perluPresensi ? 'Presensi' : 'Lihat detail'}
        varian={perluPresensi ? 'utama' : 'lembut'}
        panah
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
  tebal: { fontWeight: '600' },
  kehadiran: { paddingTop: 12, borderTopWidth: 1, alignItems: 'flex-start' },
  pil: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, flexShrink: 0 },
});
