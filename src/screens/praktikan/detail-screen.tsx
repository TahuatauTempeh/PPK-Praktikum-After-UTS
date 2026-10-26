/**
 * Detail Sesi: info lengkap sesi dan aksi presensi (UC-03, UC-04).
 * Perubahan data hanya lewat submitAttendance dari context, tampilan tombol dibaca dari state.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-context';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { allUsers } from '@/data/dummy';
import { StatusLabel } from '@/screens/praktikan/components/status-label';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { formatJamWIB, formatTanggal } from '@/screens/praktikan/format';
import { describePresensi, findOwnAttendance, presensiStatus } from '@/screens/praktikan/selectors';
import { LebarKonten, Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

export default function DetailSesiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = usePraktikanTheme();
  const { state, submitAttendance } = useSession();
  const [sheetTampil, setSheetTampil] = useState(false);
  const [fase, setFase] = useState<'konfirmasi' | 'berhasil'>('konfirmasi');
  const [notice, setNotice] = useState<string | null>(null);
  // state di callback bisa basi sampai render ulang, jadi ketukan ganda dicegah di sini
  const sedangKirim = useRef(false);

  const currentUser = useUserPraktikan();
  if (!currentUser) return null;

  const session = state.sessions.find((s) => s.id === id);
  const record = session ? findOwnAttendance(state.attendance, session.id, currentUser.id) : undefined;

  const kembali = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(praktikan)');
  };

  const header = (
    <Pressable
      onPress={kembali}
      accessibilityRole="button"
      accessibilityLabel="Kembali"
      style={styles.kembali}
    >
      <Text style={[Tipe.label, { color: theme.primary }]}>Kembali</Text>
    </Pressable>
  );

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.badan}>
          {header}
          <EmptyState
            icon=""
            title="Sesi tidak ditemukan"
            subtitle="Sesi yang kamu buka tidak ada di jadwal."
          />
          <View style={styles.footer}>
            <Tombol label="Lihat jadwal" onPress={() => router.navigate('/(praktikan)')} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const status = presensiStatus(session, record);
  const info = describePresensi(status, record);
  const asisten = allUsers.find((u) => u.id === session.assistantId)?.name ?? 'Belum ditentukan';

  const bukaSheet = () => {
    sedangKirim.current = false;
    setFase('konfirmasi');
    setNotice(null);
    setSheetTampil(true);
  };

  const konfirmasi = () => {
    if (sedangKirim.current) return;
    sedangKirim.current = true;
    const hasil = submitAttendance(session.id);
    if (hasil.success) {
      setFase('berhasil');
    } else {
      setNotice(hasil.message);
      setSheetTampil(false);
    }
  };

  const rincian = [
    ['Mata kuliah', session.course],
    ['Tanggal', formatTanggal(session.date)],
    ['Waktu', `${session.time} WIB`],
    ['Ruang', session.room],
    ['Asisten', asisten],
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.badan}>
        {header}

        <ScrollView contentContainerStyle={styles.isi}>
          <View style={styles.judul}>
            <Text accessibilityRole="header" style={[Tipe.detailTitle, { color: theme.text }]}>
              {session.title}
            </Text>
            <StatusLabel status={session.status} />
          </View>

          <View style={[styles.kotak, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {rincian.map(([label, nilai], index) => (
              <View
                key={label}
                style={[styles.rincian, index > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
              >
                <Text style={[Tipe.body, { color: theme.textSecondary }]}>{label}</Text>
                <Text style={[Tipe.label, styles.nilai, { color: theme.text }]}>{nilai}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.kotak, styles.presensi, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text accessibilityRole="header" style={[Tipe.sectionTitle, { color: theme.text }]}>
              Presensi kamu
            </Text>
            <Text style={[Tipe.body, { color: status === 'sudah-hadir' || status === 'ditutup-hadir' ? theme.success : theme.textSecondary }]}>
              {info.note}
            </Text>
            {notice ? (
              <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme.errorSoft }]}>
                <Text style={[Tipe.body, { color: theme.error }]}>{notice}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Tombol label={info.buttonLabel} disabled={!info.enabled} onPress={bukaSheet} />
        </View>
      </View>

      <BottomSheet
        visible={sheetTampil}
        title={fase === 'berhasil' ? 'Presensi berhasil' : 'Konfirmasi presensi'}
        onClose={() => setSheetTampil(false)}
      >
        {fase === 'konfirmasi' ? (
          <View style={styles.sheet}>
            <Text style={[Tipe.label, styles.tengah, { color: theme.text }]}>{session.title}</Text>
            <Text style={[Tipe.body, styles.tengah, { color: theme.textSecondary }]}>
              {formatTanggal(session.date)}, {session.time} WIB
            </Text>
            <Text style={[Tipe.body, styles.tengah, { color: theme.textSecondary }]}>
              Kehadiran dicatat sesuai waktu saat kamu menekan tombol konfirmasi dan tidak bisa dibatalkan.
            </Text>
            <View style={styles.aksi}>
              <View style={styles.aksiItem}>
                <Tombol label="Batal" variant="secondary" onPress={() => setSheetTampil(false)} />
              </View>
              <View style={styles.aksiItem}>
                <Tombol label="Ya, catat kehadiran" onPress={konfirmasi} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.sheet}>
            <Text style={[Tipe.body, styles.tengah, { color: theme.textSecondary }]}>
              Kehadiranmu tercatat pukul
            </Text>
            <Text style={[Tipe.detailTitle, styles.tengah, { color: theme.success }]}>
              {record ? formatJamWIB(record.timestamp) : '-'} WIB
            </Text>
            <Tombol label="Selesai" onPress={() => setSheetTampil(false)} />
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  badan: {
    flex: 1,
    width: '100%',
    maxWidth: LebarKonten,
    alignSelf: 'center',
  },
  kembali: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    alignSelf: 'flex-start',
  },
  isi: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: 18,
  },
  judul: {
    gap: 8,
  },
  kotak: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  rincian: {
    paddingVertical: 12,
    gap: 2,
  },
  nilai: {
    fontWeight: '600',
  },
  presensi: {
    paddingVertical: 16,
    gap: 6,
  },
  notice: {
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  sheet: {
    gap: 8,
  },
  tengah: {
    textAlign: 'center',
  },
  aksi: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  aksiItem: {
    flex: 1,
  },
});
