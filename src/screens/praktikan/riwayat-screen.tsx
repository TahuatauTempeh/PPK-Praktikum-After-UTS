/**
 * Riwayat Kehadiran: catatan presensi milik user yang sedang masuk (UC-05, DESIGN.md bagian 13).
 * Sesi belum dibuka tidak masuk riwayat. Persentase memakai rumus di ringkasRiwayat.
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
import { bukaDetailSesi, bukaJadwal } from '@/screens/praktikan/navigasi';
import { pecahJudul, ringkasRiwayat } from '@/screens/praktikan/selectors';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

export default function RiwayatScreen() {
  const theme = usePraktikanTheme();
  const currentUser = useUserPraktikan();
  const { sessions, attendance } = useSession().state;

  const ringkas = useMemo(
    () => ringkasRiwayat(sessions, attendance, currentUser?.id ?? ''),
    [sessions, attendance, currentUser?.id]
  );

  if (!currentUser) return null;

  return (
    <Layar>
      <Hero
        judul="Riwayat kehadiran"
        keterangan="Catatan presensi kamu di setiap sesi praktikum."
        watermark="riwayat"
        statistik={[
          { nilai: String(ringkas.hadir), label: 'Hadir' },
          { nilai: String(ringkas.tidakHadir), label: 'Tidak hadir' },
          { nilai: ringkas.kehadiran === null ? '-' : `${ringkas.kehadiran}%`, label: 'Kehadiran' },
        ]}
      />

      <View style={styles.judulBaris}>
        <Text accessibilityRole="header" style={[Tipe.judulBagian, { color: theme.teks }]}>
          Catatan per sesi
        </Text>
        <Text style={[Tipe.caption, { color: theme.teksSekunder }]}>Terbaru lebih dulu</Text>
      </View>

      <View style={styles.daftar}>
        {ringkas.baris.map(({ session, record }) => {
          const { mataKuliah, sesi } = pecahJudul(session);
          const belumPresensi = !record && session.status === 'open';
          return (
            <View
              key={session.id}
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
                    {mataKuliah}
                  </Text>
                  {sesi ? <Text style={[Tipe.body, { color: theme.teksSekunder }]}>{sesi}</Text> : null}
                  <View style={styles.meta}>
                    <Ikon nama="jam" ukuran={14} warna={theme.teksSekunder} />
                    <Text style={[Tipe.caption, { color: theme.teksSekunder }]}>
                      {formatRentangWIB(session.time)} | {session.room}
                    </Text>
                  </View>
                </View>

                <View style={[styles.petak, { backgroundColor: theme.isiLembut }]}>
                  {record ? (
                    <>
                      <Text style={[Tipe.caption, styles.tebal, { color: theme.sukses }]}>Hadir</Text>
                      <Text style={[Tipe.angka, { color: theme.aksen }]}>
                        {formatJamWIB(record.timestamp)} WIB
                      </Text>
                    </>
                  ) : belumPresensi ? (
                    <>
                      <Text style={[Tipe.caption, styles.tebal, { color: theme.teks }]}>Belum presensi</Text>
                      <Text style={[Tipe.kecil, { color: theme.teksSekunder }]}>Sesi sedang dibuka</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[Tipe.caption, styles.tebal, { color: theme.galat }]}>Tidak hadir</Text>
                      <Text style={[Tipe.kecil, { color: theme.teksSekunder }]}>
                        Sesi ditutup tanpa catatan presensi
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Tombol
                label={belumPresensi ? 'Presensi' : 'Lihat detail sesi'}
                varian={belumPresensi ? 'utama' : 'lembut'}
                panah
                onPress={() => bukaDetailSesi(session.id)}
              />
            </View>
          );
        })}
        {ringkas.baris.length === 0 ? (
          <Kosong
            ikon="riwayat"
            judul="Belum ada catatan kehadiran"
            keterangan="Catatan muncul setelah sesi pertama dibuka."
            aksi={{ label: 'Kembali ke jadwal', onPress: bukaJadwal }}
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
  materi: { gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  petak: { borderRadius: 20, padding: 16, gap: 2 },
});
