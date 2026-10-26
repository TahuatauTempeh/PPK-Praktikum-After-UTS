/**
 * Detail Sesi: info lengkap sesi dan aksi presensi (UC-03, UC-04).
 * Perubahan data hanya lewat submitAttendance dari context, tampilan tombol dibaca dari state.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { useSession } from '@/context/session-context';
import { allUsers } from '@/data/dummy';
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
import { describePresensi, findOwnAttendance, presensiStatus } from '@/screens/praktikan/selectors';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

const SEMUA_TEPI = ['top', 'left', 'right', 'bottom'] as const;

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
    <View style={styles.header}>
      <Pressable
        onPress={kembali}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        style={({ pressed }) => [styles.kembali, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Ikon nama="kembali" ukuran={20} warna="#FFFFFF" />
      </Pressable>
      <Text accessibilityRole="header" style={[Tipe.sectionTitle, styles.judulHeader]}>
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
          aksi={{ label: 'Lihat jadwal', onPress: () => router.navigate('/(praktikan)') }}
        />
      </Layar>
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

  const rincian: { ikon: IkonNama; label: string; nilai: string }[] = [
    { ikon: 'jadwal', label: 'Tanggal', nilai: formatTanggal(session.date) },
    { ikon: 'jam', label: 'Waktu', nilai: formatRentangWIB(session.time) },
    { ikon: 'lokasi', label: 'Ruang', nilai: session.room },
    { ikon: 'profil', label: 'Asisten', nilai: asisten },
  ];

  return (
    <Layar
      edges={SEMUA_TEPI}
      footer={
        <View style={styles.footer}>
          <Tombol label={info.buttonLabel} disabled={!info.enabled} onPress={bukaSheet} />
        </View>
      }
    >
      {header}

      <View
        style={[
          styles.kartuUtama,
          { backgroundColor: theme.kartuSorot, borderColor: theme.garisKartu, boxShadow: theme.bayang },
        ]}
      >
        <KilauKaca />
        <View style={styles.baris}>
          <Text style={[Tipe.kecil, styles.tanggal, { color: theme.teksSekunder }]}>
            {formatTanggalPendek(session.date).toUpperCase()}
          </Text>
          <StatusLabel status={session.status} />
        </View>
        <View style={styles.materi}>
          <Text accessibilityRole="header" style={[Tipe.detailTitle, { color: theme.teks }]}>
            {session.title}
          </Text>
          <Text style={[Tipe.body, { color: theme.teksSekunder }]}>{session.course}</Text>
        </View>
      </View>

      <View style={[styles.kapsul, { backgroundColor: theme.isiAksen }]}>
        <Text style={[Tipe.caption, { color: theme.diAtasAksen }]}>Presensi kamu</Text>
        <Text accessibilityRole="header" style={[Tipe.angka, { color: theme.diAtasAksen }]}>
          {info.ringkas}
        </Text>
        <Text style={[Tipe.body, { color: theme.diAtasAksen }]}>{info.note}</Text>
      </View>

      {notice ? (
        <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme.galatLembut }]}>
          <Text style={[Tipe.body, { color: theme.galat }]}>{notice}</Text>
        </View>
      ) : null}

      <Text accessibilityRole="header" style={[Tipe.judulBagian, { color: theme.teks }]}>
        Informasi sesi
      </Text>
      <View style={[styles.daftar, { backgroundColor: theme.kartu, borderColor: theme.garisKartu }]}>
        {rincian.map((item, index) => (
          <View
            key={item.label}
            style={[styles.rincian, index > 0 && { borderTopWidth: 1, borderTopColor: theme.pemisah }]}
          >
            <View style={[styles.ikonBulat, { backgroundColor: theme.isiLembut }]}>
              <Ikon nama={item.ikon} ukuran={18} warna={theme.aksen} />
            </View>
            <View style={styles.teksRincian}>
              <Text style={[Tipe.kecil, { color: theme.teksSekunder }]}>{item.label}</Text>
              <Text style={[Tipe.label, { color: theme.teks }]}>{item.nilai}</Text>
            </View>
          </View>
        ))}
      </View>

      <BottomSheet
        visible={sheetTampil}
        title={fase === 'berhasil' ? 'Presensi berhasil' : 'Konfirmasi presensi'}
        onClose={() => setSheetTampil(false)}
      >
        {fase === 'konfirmasi' ? (
          <View style={styles.sheet}>
            <Text style={[Tipe.label, styles.tengah, { color: theme.teks }]}>{session.title}</Text>
            <Text style={[Tipe.body, styles.tengah, { color: theme.teksSekunder }]}>
              {formatTanggal(session.date)}, {formatRentangWIB(session.time)}
            </Text>
            <Text style={[Tipe.body, styles.tengah, { color: theme.teksSekunder }]}>
              Kehadiran dicatat sesuai waktu saat kamu menekan tombol konfirmasi dan tidak bisa dibatalkan.
            </Text>
            <View style={styles.aksi}>
              <View style={styles.aksiItem}>
                <Tombol label="Batal" varian="lembut" onPress={() => setSheetTampil(false)} />
              </View>
              <View style={styles.aksiItem}>
                <Tombol label="Ya, catat kehadiran" onPress={konfirmasi} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.sheet}>
            <Text style={[Tipe.body, styles.tengah, { color: theme.teksSekunder }]}>
              Kehadiranmu tercatat pukul
            </Text>
            <Text style={[Tipe.detailTitle, styles.tengah, { color: theme.sukses }]}>
              {record ? formatJamWIB(record.timestamp) : '-'} WIB
            </Text>
            <Tombol label="Selesai" onPress={() => setSheetTampil(false)} />
          </View>
        )}
      </BottomSheet>
    </Layar>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  kembali: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  judulHeader: { flex: 1, textAlign: 'center', color: '#FFFFFF' },
  penyeimbang: { width: 44 },
  kartuUtama: { overflow: 'hidden', padding: 20, gap: 14, borderRadius: 28, borderWidth: 1 },
  baris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tanggal: { fontWeight: '600', letterSpacing: 0.6 },
  materi: { gap: 6 },
  kapsul: { borderRadius: 24, padding: 18, gap: 4 },
  notice: { borderRadius: 16, padding: 14 },
  daftar: { borderRadius: 24, borderWidth: 1, paddingHorizontal: 16 },
  rincian: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  ikonBulat: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  teksRincian: { flex: 1, gap: 2 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, width: '100%', maxWidth: 648, alignSelf: 'center' },
  sheet: { gap: 8 },
  tengah: { textAlign: 'center' },
  aksi: { flexDirection: 'row', gap: 12, marginTop: 8 },
  aksiItem: { flex: 1 },
});
