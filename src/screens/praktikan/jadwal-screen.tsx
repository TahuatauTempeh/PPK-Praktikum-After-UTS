/**
 * Jadwal Praktikan: daftar sesi dari SessionContext (UC-02, DESIGN.md bagian 9).
 * Banner meringkas tanggal aktif, kartu biru menonjolkan sesi yang bisa dipresensi,
 * chip memfilter berdasarkan status.
 */

import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/context/session-context';
import { useFirestoreSchedule } from '@/lib/useSessionFirestore';
import { Hero } from '@/screens/praktikan/components/hero';
import { Kosong } from '@/screens/praktikan/components/kosong';
import { Layar } from '@/screens/praktikan/components/layar';
import { SesiBerlangsung } from '@/screens/praktikan/components/sesi-berlangsung';
import { SesiCard } from '@/screens/praktikan/components/sesi-card';
import { STATUS_LABEL } from '@/screens/praktikan/components/status-label';
import { formatTanggalPendek, sapaanWIB, tanggalHariIniWIB } from '@/screens/praktikan/format';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { bukaDetailSesi, bukaRiwayat } from '@/screens/praktikan/navigasi';
import { findOwnAttendance, tanggalAktif, urutkanSesi } from '@/screens/praktikan/selectors';
import { usePraktikanSchedule } from '@/screens/praktikan/use-praktikan-schedule';
import { fonts, typography, useTheme } from '@/theme';
import { SessionStatus } from '@/types';

type Saring = 'semua' | SessionStatus;
const DAFTAR_SARING: Saring[] = ['semua', 'scheduled', 'open', 'closed'];

export default function JadwalScreen() {
  const theme = useTheme();
  const currentUser = useUserPraktikan();
  const { attendance } = useSession().state;
  const { sessions, loading, error, refresh } = usePraktikanSchedule(currentUser?.id ?? '');
  const [saring, setSaring] = useState<Saring>('semua');

  const sessions = useMemo(() => {
    if (firestoreSessions.length === 0) return dummySessions;
    const fsMapped = firestoreSessions.map((s) => ({
      id: s.id,
      title: s.title,
      course: s.title,
      date: s.date,
      time: `${s.startTime} - ${s.endTime}`,
      room: s.room,
      assistantId: s.assistantId,
      status: s.status,
    }));
    return fsMapped;
  }, [firestoreSessions, dummySessions]);

  const urut = useMemo(() => urutkanSesi(sessions), [sessions]);
  const sapaan = useMemo(() => sapaanWIB(), []);
  const hariIni = useMemo(() => tanggalHariIniWIB(), []);

  if (!currentUser) return null;

  const jumlah = (nilai: Saring) =>
    nilai === 'semua' ? urut.length : urut.filter((s) => s.status === nilai).length;
  const tampil = urut.filter((s) => saring === 'semua' || s.status === saring);
  const berlangsung = urut.find(
    (s) => s.status === 'open' && !findOwnAttendance(attendance, s.id, currentUser.id)
  );

  const aktif = tanggalAktif(sessions, hariIni);
  const sesiAktif = urut.filter((s) => s.date === aktif);
  const dibukaAktif = sesiAktif.filter((s) => s.status === 'open').length;

  return (
    <Layar>
      <Hero
        sapaan="Jadwal Praktikum"
        judul={`${sapaan}, ${currentUser.name.split(' ')[0]}`}
        keterangan={`${currentUser.name} · ${currentUser.nim}`}
        watermark="jadwal"
        statistik={[
          {
            nilai: formatTanggalPendek(aktif),
            label: `${sesiAktif.length} sesi hari ini · ${dibukaAktif} sedang dibuka`,
          },
        ]}
      />

      {berlangsung ? (
        <SesiBerlangsung session={berlangsung} onPress={() => bukaDetailSesi(berlangsung.id)} />
      ) : null}

      <View style={styles.judulBaris}>
        <Text accessibilityRole="header" style={[typography.sectionHeading, { color: theme.colors.textPrimary }]}>
          Daftar sesi
        </Text>
        <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{tampil.length} sesi</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.saringan}
        contentContainerStyle={styles.chip}
        accessibilityLabel="Filter status sesi"
      >
        {DAFTAR_SARING.map((nilai) => {
          const terpilih = nilai === saring;
          const label = nilai === 'semua' ? 'Semua' : STATUS_LABEL[nilai];
          return (
            <Pressable
              key={nilai}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${jumlah(nilai)} sesi`}
              accessibilityState={{ selected: terpilih }}
              onPress={() => setSaring(nilai)}
              style={({ pressed }) => [
                styles.chipTombol,
                {
                  backgroundColor: terpilih ? theme.colors.primaryFill : theme.colors.glassCard,
                  borderColor: terpilih ? theme.colors.primaryFill : theme.colors.glassBorder,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[typography.caption, styles.tebal, { color: terpilih ? theme.colors.onPrimary : theme.colors.textSecondary }]}
              >
                {label}
              </Text>
              <Text style={[typography.tiny, styles.tebal, { color: terpilih ? theme.colors.onPrimary : theme.colors.textSecondary }]}>
                {jumlah(nilai)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.daftar} accessibilityLiveRegion="polite">
        {loading ? (
          <View style={styles.muat}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>Memuat jadwal praktikum...</Text>
          </View>
        ) : error ? (
          <Kosong
            ikon="jadwal"
            judul="Gagal memuat jadwal"
            keterangan={error}
            aksi={{ label: 'Coba lagi', onPress: () => void refresh() }}
          />
        ) : (
          <>
            {tampil.map((session) => (
              <SesiCard
                key={session.id}
                session={session}
                record={findOwnAttendance(attendance, session.id, currentUser.id)}
                onPress={() => bukaDetailSesi(session.id)}
              />
            ))}
            {tampil.length === 0 ? (
              urut.length === 0 ? (
                <Kosong
                  ikon="jadwal"
                  judul="Belum ada jadwal"
                  keterangan="Kamu belum terdaftar di kelas praktikum mana pun."
                  aksi={{ label: 'Lihat riwayat kehadiran', onPress: bukaRiwayat }}
                />
              ) : (
                <Kosong
                  ikon="jadwal"
                  judul="Tidak ada sesi untuk filter ini"
                  aksi={{ label: 'Tampilkan semua sesi', onPress: () => setSaring('semua') }}
                />
              )
            ) : null}
          </>
        )}
      </View>
    </Layar>
  );
}

const styles = StyleSheet.create({
  judulBaris: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 },
  // flexGrow 0: tanpa ini baris chip ikut meninggi saat daftar di bawahnya pendek, dan chip berubah jadi lingkaran
  saringan: { marginHorizontal: -24, flexGrow: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 24, paddingRight: 24, paddingBottom: 2 },
  chipTombol: {
    minHeight: 44,
    paddingHorizontal: 14,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
  },
  tebal: { fontFamily: fonts.semibold },
  daftar: { gap: 14 },
  muat: { paddingVertical: 40, alignItems: 'center', gap: 12 },
});
