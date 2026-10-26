/**
 * Riwayat Kehadiran: catatan presensi milik user yang sedang masuk (UC-05).
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/context/session-context';
import { Hero } from '@/screens/praktikan/components/hero';
import { Ikon } from '@/screens/praktikan/components/ikon';
import { Kosong } from '@/screens/praktikan/components/kosong';
import { Layar } from '@/screens/praktikan/components/layar';
import { StatusLabel } from '@/screens/praktikan/components/status-label';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { formatJamWIB, formatRentangWIB, formatTanggalPendek } from '@/screens/praktikan/format';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { bukaDetailSesi } from '@/screens/praktikan/navigasi';
import { ownHistory } from '@/screens/praktikan/selectors';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

export default function RiwayatScreen() {
  const theme = usePraktikanTheme();
  const currentUser = useUserPraktikan();
  const { sessions, attendance } = useSession().state;

  const riwayat = useMemo(
    () => ownHistory(sessions, attendance, currentUser?.id),
    [sessions, attendance, currentUser?.id]
  );

  if (!currentUser) return null;

  return (
    <Layar>
      <Hero
        eyebrow="RIWAYAT KEHADIRAN"
        judul="Catatan presensi"
        watermark="riwayat"
        statistik={[
          { nilai: String(riwayat.length), label: 'Total hadir' },
          {
            nilai: riwayat.length > 0 ? formatTanggalPendek(riwayat[0].session.date) : '-',
            label: 'Sesi terakhir',
          },
        ]}
      />

      <View style={styles.judulBaris}>
        <Text accessibilityRole="header" style={[Tipe.judulBagian, { color: theme.teks }]}>
          Catatan per sesi
        </Text>
        <Text style={[Tipe.caption, { color: theme.teksSekunder }]}>Terbaru lebih dulu</Text>
      </View>

      <View style={styles.daftar}>
        {riwayat.map(({ session, record }) => (
          <View
            key={record.id}
            style={[
              styles.kartu,
              { backgroundColor: theme.kartu, borderColor: theme.garisKartu, boxShadow: theme.bayang },
            ]}
          >
            <View style={styles.isi}>
              <View style={styles.baris}>
                <Text style={[Tipe.kecil, styles.tebal, styles.tanggal, { color: theme.teksSekunder }]}>
                  {formatTanggalPendek(session.date).toUpperCase()}
                </Text>
                <StatusLabel status={session.status} />
              </View>

              <View style={styles.materi}>
                <Text accessibilityRole="header" style={[Tipe.judulKartu, { color: theme.teks }]}>
                  {session.title}
                </Text>
                <View style={styles.meta}>
                  <Ikon nama="jam" ukuran={14} warna={theme.teksSekunder} />
                  <Text style={[Tipe.caption, { color: theme.teksSekunder }]}>
                    {formatRentangWIB(session.time)} | {session.room}
                  </Text>
                </View>
              </View>

              <View style={[styles.petak, { backgroundColor: theme.isiLembut }]}>
                <Text style={[Tipe.angka, { color: theme.aksen }]}>
                  {formatJamWIB(record.timestamp)}
                </Text>
                <Text style={[Tipe.caption, styles.tebal, { color: theme.sukses }]}>Hadir</Text>
                <Text style={[Tipe.kecil, { color: theme.teksSekunder }]}>Tercatat pukul WIB</Text>
              </View>
            </View>
            <Tombol label="Lihat detail sesi" varian="lembut" panah onPress={() => bukaDetailSesi(session.id)} />
          </View>
        ))}
        {riwayat.length === 0 ? (
          <Kosong
            ikon="riwayat"
            judul="Belum ada catatan kehadiran"
            keterangan="Catatan akan muncul di sini setelah kamu melakukan presensi di sebuah sesi."
          />
        ) : null}
      </View>
    </Layar>
  );
}

const styles = StyleSheet.create({
  judulBaris: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 },
  daftar: { gap: 14 },
  kartu: { padding: 7, borderRadius: 28, borderWidth: 1 },
  isi: { padding: 14, gap: 16 },
  baris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tanggal: { letterSpacing: 0.6 },
  tebal: { fontWeight: '600' },
  materi: { gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  petak: { borderRadius: 20, padding: 16, gap: 2 },
});
