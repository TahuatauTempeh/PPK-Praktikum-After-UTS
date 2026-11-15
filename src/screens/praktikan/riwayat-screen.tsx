/**
 * Riwayat Kehadiran: catatan presensi milik user yang sedang masuk (UC-05, DESIGN.md bagian 13).
 * Sesi belum dibuka tidak masuk riwayat. Persentase memakai rumus di ringkasRiwayat.
 * Kartu per sesi memakai SesiCard yang sama dengan halaman jadwal agar tampilannya konsisten.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSession } from '@/context/session-context';
import { Hero } from '@/screens/praktikan/components/hero';
import { Kosong } from '@/screens/praktikan/components/kosong';
import { Layar } from '@/screens/praktikan/components/layar';
import { SesiCard } from '@/screens/praktikan/components/sesi-card';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { bukaDetailSesi, bukaJadwal } from '@/screens/praktikan/navigasi';
import { ringkasRiwayat } from '@/screens/praktikan/selectors';

export default function RiwayatScreen() {
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
        watermark="riwayat"
        statistik={[
          { nilai: String(ringkas.hadir), label: 'Hadir' },
          { nilai: String(ringkas.tidakHadir), label: 'Tidak hadir' },
          { nilai: ringkas.kehadiran === null ? '-' : `${ringkas.kehadiran}%`, label: 'Kehadiran' },
        ]}
      />

      <View style={styles.daftar}>
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
            keterangan="Catatan muncul setelah sesi pertama dibuka."
            aksi={{ label: 'Kembali ke jadwal', onPress: bukaJadwal }}
          />
        ) : null}
      </View>
    </Layar>
  );
}

const styles = StyleSheet.create({
  daftar: { gap: 14 },
});
