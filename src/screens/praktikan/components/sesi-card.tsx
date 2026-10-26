/**
 * SesiCard: kartu sesi di jadwal praktikan.
 * Kartu sesi yang sedang dibuka diberi kilau kaca dan tombol terisi sebagai titik fokus layar.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ikon } from '@/screens/praktikan/components/ikon';
import { KilauKaca } from '@/screens/praktikan/components/latar';
import { StatusLabel } from '@/screens/praktikan/components/status-label';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { formatJamWIB, formatRentangWIB, formatTanggal } from '@/screens/praktikan/format';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';
import { AttendanceRecord, Session } from '@/types';

interface SesiCardProps {
  session: Session;
  record?: AttendanceRecord;
  onPress: () => void;
}

const KETERANGAN_BELUM_HADIR = {
  scheduled: 'Presensi belum dibuka',
  open: 'Kamu belum presensi',
  closed: 'Tidak ada catatan kehadiran',
} as const;

export function SesiCard({ session, record, onPress }: SesiCardProps) {
  const theme = usePraktikanTheme();
  const dibuka = session.status === 'open';
  const perluPresensi = dibuka && !record;

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
          <View style={styles.jam}>
            <Ikon nama="jam" ukuran={15} warna={theme.teksSekunder} />
            <Text style={[Tipe.caption, styles.tebal, { color: theme.teks }]}>
              {formatRentangWIB(session.time)}
            </Text>
          </View>
          <StatusLabel status={session.status} />
        </View>

        <View style={styles.materi}>
          <Text accessibilityRole="header" style={[Tipe.judulKartu, { color: theme.teks }]}>
            {session.title}
          </Text>
          <Text style={[Tipe.body, { color: theme.teksSekunder }]}>{formatTanggal(session.date)}</Text>
        </View>

        <View style={styles.jam}>
          <Ikon nama="lokasi" ukuran={14} warna={theme.teksSekunder} />
          <Text style={[Tipe.kecil, { color: theme.teksSekunder }]}>{session.room}</Text>
        </View>

        <View style={[styles.kehadiran, { borderTopColor: theme.pemisah }]}>
          {record ? (
            <Text style={[Tipe.caption, styles.tebal, { color: theme.sukses }]}>
              Hadir pukul {formatJamWIB(record.timestamp)} WIB
            </Text>
          ) : (
            <Text style={[Tipe.caption, { color: theme.teksSekunder }]}>
              {KETERANGAN_BELUM_HADIR[session.status]}
            </Text>
          )}
        </View>
      </View>

      <Tombol
        label={perluPresensi ? 'Presensi sekarang' : 'Lihat detail sesi'}
        varian={perluPresensi ? 'utama' : 'lembut'}
        panah
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: { padding: 7, borderRadius: 28, borderWidth: 1, overflow: 'hidden' },
  isi: { padding: 14, gap: 16 },
  baris: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  jam: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  tebal: { fontWeight: '600' },
  materi: { gap: 4 },
  kehadiran: { paddingTop: 14, borderTopWidth: 1 },
});
