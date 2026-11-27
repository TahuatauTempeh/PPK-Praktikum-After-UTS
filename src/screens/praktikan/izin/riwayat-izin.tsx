/**
 * Tab Izin praktikan (task 4.1, 4.5): form izin di atas, riwayat izin realtime di bawah.
 * Daftar sesi memakai usePraktikanSchedule, sumber yang sama dengan Jadwal: sesi Firestore
 * dari kelas yang diikuti praktikan.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { pantauIzinSaya, type PermissionRequest, type PermissionStatus } from '@/lib/permission-service';
import { Hero } from '@/screens/praktikan/components/hero';
import { Kosong } from '@/screens/praktikan/components/kosong';
import { Layar } from '@/screens/praktikan/components/layar';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { urutkanSesi } from '@/screens/praktikan/selectors';
import { usePraktikanSchedule } from '@/screens/praktikan/use-praktikan-schedule';
import {
  STATUS_IZIN,
  formatWaktuIzin,
  namaSesi,
  type KeadaanSesi,
} from '@/screens/shared/izin';
import { fonts, typography, useTheme } from '@/theme';
import type { Session } from '@/types';

import { FormIzin } from './form-izin';

export default function IzinScreen() {
  const theme = useTheme();
  const currentUser = useUserPraktikan();
  const jadwal = usePraktikanSchedule(currentUser?.id ?? '');
  const sessions = jadwal.sessions;
  const keadaanSesi: KeadaanSesi = jadwal.loading ? 'memuat' : jadwal.error ? 'galat' : 'siap';
  const [daftar, setDaftar] = useState<PermissionRequest[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);
  const [cobaLagi, setCobaLagi] = useState(0);
  const userId = currentUser?.id;

  useEffect(() => {
    if (!userId) return;
    return pantauIzinSaya(
      userId,
      (hasil) => {
        setDaftar(hasil);
        setGalat(null);
        setMemuat(false);
      },
      (pesan) => {
        setGalat(pesan);
        setMemuat(false);
      }
    );
  }, [userId, cobaLagi]);

  const urut = useMemo(() => urutkanSesi(sessions), [sessions]);
  const sesiBerizin = useMemo(() => new Set(daftar.map((izin) => izin.sessionId)), [daftar]);

  if (!currentUser) return null;

  const hitung = (status: PermissionStatus) =>
    memuat || galat ? '-' : String(daftar.filter((izin) => izin.status === status).length);

  return (
    <Layar>
      <Hero
        judul="Izin tidak hadir"
        watermark="izin"
        statistik={[
          { nilai: hitung('pending'), label: STATUS_IZIN.pending },
          { nilai: hitung('approved'), label: STATUS_IZIN.approved },
          { nilai: hitung('rejected'), label: STATUS_IZIN.rejected },
        ]}
      />

      <FormIzin
        user={currentUser}
        sessions={urut}
        sesiBerizin={sesiBerizin}
        memuatSesi={jadwal.loading}
        galatSesi={jadwal.error}
        muatUlangSesi={jadwal.refresh}
      />

      <View style={styles.judulBaris}>
        <Text accessibilityRole="header" style={[typography.sectionHeading, { color: theme.colors.textPrimary }]}>
          Riwayat izin
        </Text>
        {!memuat && !galat ? (
          <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{daftar.length} izin</Text>
        ) : null}
      </View>

      <View style={styles.daftar} accessibilityLiveRegion="polite">
        {memuat ? (
          <View style={styles.memuat}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={[typography.body, { color: theme.colors.textSecondary }]}>Memuat riwayat izin...</Text>
          </View>
        ) : galat ? (
          <Kosong
            ikon="izin"
            judul="Riwayat izin gagal dimuat"
            keterangan={galat}
            aksi={{
              label: 'Coba lagi',
              onPress: () => {
                setMemuat(true);
                setGalat(null);
                setCobaLagi((nilai) => nilai + 1);
              },
            }}
          />
        ) : daftar.length === 0 ? (
          <Kosong
            ikon="izin"
            judul="Belum ada izin"
            keterangan="Izin yang kamu kirim lewat form di atas akan muncul di sini."
          />
        ) : (
          daftar.map((izin) => (
            <KartuIzin
              key={izin.id}
              izin={izin}
              session={sessions.find((s) => s.id === izin.sessionId)}
              keadaanSesi={keadaanSesi}
            />
          ))
        )}
      </View>
    </Layar>
  );
}

function KartuIzin({ izin, session, keadaanSesi }: { izin: PermissionRequest; session?: Session; keadaanSesi: KeadaanSesi }) {
  const theme = useTheme();
  const warna = {
    pending: { latar: theme.colors.softSurface, teks: theme.colors.textSecondary },
    approved: { latar: theme.colors.successSoft, teks: theme.colors.success },
    rejected: { latar: theme.colors.errorSoft, teks: theme.colors.error },
  }[izin.status];

  return (
    <View
      style={[
        styles.kartu,
        { backgroundColor: theme.colors.glassCard, borderColor: theme.colors.glassBorder, boxShadow: theme.colors.shadow },
      ]}
    >
      <View style={styles.baris}>
        <Text style={[typography.eyebrow, { color: theme.colors.textSecondary }]}>IZIN</Text>
        <View style={[styles.label, { backgroundColor: warna.latar }]}>
          <View style={[styles.titik, { backgroundColor: warna.teks }]} />
          <Text style={[typography.tiny, styles.tebal, { color: warna.teks }]}>{STATUS_IZIN[izin.status]}</Text>
        </View>
      </View>

      <View style={styles.materi}>
        <Text accessibilityRole="header" style={[typography.cardTitle, { color: theme.colors.textPrimary }]}>
          {namaSesi(session, keadaanSesi)}
        </Text>
        <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
          {izin.menungguServer
            ? 'Menunggu koneksi, terkirim otomatis saat online'
            : `Diajukan ${formatWaktuIzin(izin.createdAt)}`}
        </Text>
      </View>

      <Text style={[typography.body, { color: theme.colors.textPrimary }]}>{izin.reason}</Text>

      {izin.status !== 'pending' ? (
        <View style={[styles.bagian, { borderTopColor: theme.colors.hairline }]}>
          <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
            Ditinjau {formatWaktuIzin(izin.reviewedAt)}
          </Text>
          <Text style={[typography.body, { color: theme.colors.textPrimary }]}>
            {izin.reviewNote ? `Catatan asisten: ${izin.reviewNote}` : 'Tanpa catatan dari asisten.'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  judulBaris: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 },
  daftar: { gap: 14 },
  memuat: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  kartu: { padding: 18, gap: 14, borderRadius: 28, borderWidth: 1 },
  baris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  titik: { width: 5, height: 5, borderRadius: 3 },
  tebal: { fontFamily: fonts.semibold },
  materi: { gap: 4 },
  bagian: { gap: 4, paddingTop: 12, borderTopWidth: 1 },
});
