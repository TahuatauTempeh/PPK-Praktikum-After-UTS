/**
 * Detail Sesi: info lengkap sesi dan status presensi (UC-03, DESIGN.md bagian 10 dan 11).
 * Sprint 3 (PRD 8.3): layar ini tidak menulis presensi. Bila sesi dibuka dan belum
 * presensi, tombol membuka halaman presensi berbasis lokasi `/praktikan/presensi/[id]`.
 *
 * Jika user sudah login via Firebase Auth (useAuth().profile tersedia), data sesi dan
 * presensi dibaca realtime lewat useMyAttendance. Jika belum, fallback ke data dummy.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useSession } from '@/context/session-context';
import { allUsers } from '@/data/dummy';
import { useMyAttendance } from '@/lib/useSessionFirestore';
import { Ikon, IkonNama } from '@/screens/praktikan/components/ikon';
import { Kosong } from '@/screens/praktikan/components/kosong';
import { KilauKaca } from '@/screens/praktikan/components/latar';
import { Layar } from '@/screens/praktikan/components/layar';
import { StatusLabel } from '@/screens/praktikan/components/status-label';
import { Tombol } from '@/screens/praktikan/components/tombol';
import {
  formatJamWIB,
  formatRentangWIB,
  formatTanggal,
  formatTanggalPendek,
} from '@/screens/praktikan/format';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { bukaJadwal, bukaPresensi, bukaRiwayat } from '@/screens/praktikan/navigasi';
import { describePresensi, findOwnAttendance, pecahJudul, presensiStatus } from '@/screens/praktikan/selectors';
import { fonts, typography, useTheme } from '@/theme';

const SEMUA_TEPI = ['top', 'left', 'right', 'bottom'] as const;

export default function DetailSesiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { state } = useSession();
  const { profile } = useAuth();

  // Hook selalu dipanggil (Rules of Hooks), tapi hasilnya hanya dipakai jika profile ada.
  const { session: fsSession, myRecord: fsRecord } = useMyAttendance(id ?? '', profile);

  const useFirestore = profile !== null && id !== undefined;

  const currentUser = useUserPraktikan();
  if (!currentUser) return null;

  // Jika Firestore: gunakan data realtime; jika tidak, gunakan data dummy SessionContext
  const session = (useFirestore && fsSession)
    ? {
        id: fsSession.id,
        title: fsSession.title,
        course: fsSession.title,
        date: fsSession.date,
        time: `${fsSession.startTime} - ${fsSession.endTime}`,
        room: fsSession.room,
        assistantId: fsSession.assistantId,
        status: (fsSession.status === 'scheduled' ? 'scheduled' : fsSession.status) as 'scheduled' | 'open' | 'closed',
        laboratoryId: fsSession.laboratoryId ?? '',
      }
    : state.sessions.find((s) => s.id === id);

  const record = useFirestore
    ? (fsRecord
        ? {
            id: fsRecord.id,
            sessionId: fsRecord.sessionId,
            userId: fsRecord.userId,
            userName: fsRecord.userName,
            timestamp: typeof fsRecord.recordedAt === 'string'
              ? fsRecord.recordedAt
              : (fsRecord.recordedAt && typeof (fsRecord.recordedAt as { toDate?: () => Date }).toDate === 'function')
                ? (fsRecord.recordedAt as { toDate: () => Date }).toDate().toISOString()
                : new Date().toISOString(),
          }
        : undefined)
    : (session ? findOwnAttendance(state.attendance, session.id, currentUser.id) : undefined);

  const kembali = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(praktikan)');
  };

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={kembali}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        style={({ pressed }) => [styles.kembali, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Ikon nama="kembali" ukuran={20} warna="#FFFFFF" />
      </Pressable>
      <Text accessibilityRole="header" style={[typography.sectionTitle, styles.judulHeader]}>
        Detail sesi
      </Text>
      <View style={styles.penyeimbang} />
    </View>
  );

  if (!session) {
    return (
      <Layar edges={SEMUA_TEPI}>
        {header}
        <Kosong
          ikon="jadwal"
          judul="Sesi tidak ditemukan"
          keterangan="Sesi yang kamu buka tidak ada di jadwal."
          aksi={{ label: 'Kembali ke jadwal', onPress: bukaJadwal }}
        />
      </Layar>
    );
  }

  const status = presensiStatus(session, record);
  const info = describePresensi(status);
  const { mataKuliah, sesi } = pecahJudul(session);
  // Sesi Firestore menyimpan nama asisten; data dummy hanya untuk mode tanpa login.
  const asisten =
    (useFirestore ? fsSession?.assistantName?.trim() : undefined) ||
    allUsers.find((u) => u.id === session.assistantId)?.name ||
    'Belum ditentukan';
  const bentuk = record ? 'sukses' : status === 'ditutup-tanpa-catatan' ? 'galat' : 'aksen';

  const rincian: { ikon: IkonNama; label: string; nilai: string }[] = [
    { ikon: 'jadwal', label: 'Tanggal', nilai: formatTanggal(session.date) },
    { ikon: 'jam', label: 'Waktu', nilai: formatRentangWIB(session.time) },
    { ikon: 'lokasi', label: 'Ruang', nilai: session.room },
    { ikon: 'profil', label: 'Asisten', nilai: asisten },
  ];

  const footer =
    info.aksi === 'tidak-ada' ? undefined : (
      <View style={styles.footer}>
        {info.aksi === 'presensi' ? (
          <Tombol label="Buka halaman presensi" panah onPress={() => bukaPresensi(session.id)} />
        ) : null}
        {info.aksi === 'nonaktif' ? (
          <>
            <Tombol
              label="Buka halaman presensi"
              disabled
              petunjuk={info.alasan}
              onPress={() => bukaPresensi(session.id)}
            />
            <Text style={[typography.caption, styles.tengah, { color: theme.colors.textSecondary }]}>
              {info.alasan}
            </Text>
          </>
        ) : null}
        {info.aksi === 'riwayat' ? (
          <Tombol label="Lihat riwayat kehadiran" varian="lembut" panah onPress={bukaRiwayat} />
        ) : null}
      </View>
    );

  return (
    <Layar
      edges={SEMUA_TEPI}
      footer={footer}
    >
      {header}

      <View
        style={[
          styles.kartuUtama,
          { backgroundColor: theme.colors.cardOpen, borderColor: theme.colors.glassBorder, boxShadow: theme.colors.shadow },
        ]}
      >
        <KilauKaca />
        <View style={styles.baris}>
          <Text style={[typography.tiny, styles.tanggal, { color: theme.colors.textSecondary }]}>
            {formatTanggalPendek(session.date).toUpperCase()}
          </Text>
          <StatusLabel status={session.status} />
        </View>
        <View style={styles.materi}>
          <Text accessibilityRole="header" style={[typography.detailTitle, { color: theme.colors.textPrimary }]}>
            {mataKuliah}
          </Text>
          {sesi ? <Text style={[typography.body, { color: theme.colors.textSecondary }]}>{sesi}</Text> : null}
        </View>
      </View>

      <View
        style={[
          styles.kapsul,
          bentuk === 'aksen' && { backgroundColor: theme.colors.primaryFill },
          bentuk === 'sukses' && { backgroundColor: theme.colors.successSoft },
          bentuk === 'galat' && { backgroundColor: theme.colors.glassCard, borderWidth: 1, borderColor: theme.colors.glassBorder },
        ]}
      >
        <Text
          style={[
            typography.caption,
            { color: bentuk === 'aksen' ? theme.colors.onPrimary : theme.colors.textSecondary },
          ]}
        >
          Presensi kamu
        </Text>
        <Text
          accessibilityRole="header"
          style={[
            record ? typography.sectionTitle : typography.numeric,
            { color: bentuk === 'aksen' ? theme.colors.onPrimary : bentuk === 'sukses' ? theme.colors.success : theme.colors.error },
          ]}
        >
          {info.ringkas}
        </Text>
        {record ? (
          <>
            <Text style={[typography.timeDisplay, { color: theme.colors.success }]}>{formatJamWIB(record.timestamp)} WIB</Text>
            <Text style={[typography.body, { color: theme.colors.textSecondary }]}>
              {info.note ? `${info.note}. ` : ''}
              {formatTanggal(session.date)}
            </Text>
          </>
        ) : (
          <Text style={[typography.body, { color: bentuk === 'aksen' ? theme.colors.onPrimary : theme.colors.textSecondary }]}>
            {info.note}
          </Text>
        )}
      </View>

      <Text accessibilityRole="header" style={[typography.sectionHeading, { color: theme.colors.textPrimary }]}>
        Informasi sesi
      </Text>
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
    </Layar>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  // Area sentuh 44 px; panah duduk langsung di gradien halaman tanpa kotak kaca.
  kembali: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  judulHeader: { flex: 1, textAlign: 'center', color: '#FFFFFF' },
  penyeimbang: { width: 44 },
  kartuUtama: { overflow: 'hidden', padding: 20, gap: 14, borderRadius: 28, borderWidth: 1 },
  baris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tanggal: { fontFamily: fonts.semibold, letterSpacing: 0.6 },
  materi: { gap: 6 },
  kapsul: { borderRadius: 24, padding: 18, gap: 4 },
  daftar: { borderRadius: 24, borderWidth: 1, paddingHorizontal: 16 },
  rincian: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  ikonBulat: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  teksRincian: { flex: 1, gap: 2 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, width: '100%', maxWidth: 648, alignSelf: 'center', gap: 8 },
  tengah: { textAlign: 'center' },
});
