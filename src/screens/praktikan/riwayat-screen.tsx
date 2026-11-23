/**
 * Riwayat Kehadiran: catatan presensi milik user yang sedang masuk (UC-05, DESIGN.md bagian 13).
 * Sesi belum dibuka tidak masuk riwayat. Persentase memakai rumus di ringkasRiwayat.
 * Kartu per sesi memakai SesiCard yang sama dengan halaman jadwal agar tampilannya konsisten.
 */

import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Hero } from '@/screens/praktikan/components/hero';
import { Kosong } from '@/screens/praktikan/components/kosong';
import { Layar } from '@/screens/praktikan/components/layar';
import { SesiCard } from '@/screens/praktikan/components/sesi-card';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { bukaDetailSesi, bukaJadwal } from '@/screens/praktikan/navigasi';
import { ringkasRiwayat } from '@/screens/praktikan/selectors';
import { usePraktikanSchedule } from '@/screens/praktikan/use-praktikan-schedule';
import { typography, useTheme } from '@/theme';

export default function RiwayatScreen() {
  const theme = useTheme();
  const currentUser = useUserPraktikan();
  const { sessions, attendance, loading, error, refresh } = usePraktikanSchedule(
    currentUser?.id ?? ''
  );

  const ringkas = useMemo(
    () => ringkasRiwayat(sessions, attendance, currentUser?.id ?? ''),
    [sessions, attendance, currentUser?.id]
  );

  if (!currentUser) return null;

  return (
    <Layar>
      <Hero
        judul="Riwayat kehadiran"
        watermark="riwayat"
        statistik={[
          { nilai: String(ringkas.hadir), label: 'Hadir' },
          { nilai: String(ringkas.tidakHadir), label: 'Tidak hadir' },
          { nilai: ringkas.kehadiran === null ? '-' : `${ringkas.kehadiran}%`, label: 'Kehadiran' },
        ]}
      />

      <View style={styles.daftar}>
        {loading ? (
          <View style={styles.muat}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
              Memuat riwayat kehadiran...
            </Text>
          </View>
        ) : error ? (
          <Kosong
            ikon="riwayat"
            judul="Gagal memuat riwayat"
            keterangan={error}
            aksi={{ label: 'Coba lagi', onPress: () => void refresh() }}
          />
        ) : (
          <>
            {ringkas.baris.map(({ session, record }) => (
              <SesiCard
                key={session.id}
                session={session}
                record={record}
                onPress={() => bukaDetailSesi(session.id)}
              />
            ))}
            {ringkas.baris.length === 0 ? (
              <Kosong
                ikon="riwayat"
                judul="Belum ada catatan kehadiran"
                keterangan="Catatan muncul setelah sesi kelasmu dibuka."
                aksi={{ label: 'Kembali ke jadwal', onPress: bukaJadwal }}
              />
            ) : null}
          </>
        )}
      </View>
    </Layar>
  );
}

const styles = StyleSheet.create({
  daftar: { gap: 14 },
  muat: { paddingVertical: 40, alignItems: 'center', gap: 12 },
});
