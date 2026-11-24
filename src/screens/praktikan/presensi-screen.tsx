/**
 * Halaman presensi berbasis lokasi (PRD Sprint 3 bagian 7.1 dan 8.2, FR-ATT-01..11).
 * Urutan: header, kartu sesi, pemeriksaan lokasi, status presensi, footer aksi.
 *
 * `PresensiTampilan` hanya membaca model; `usePresensi` mengisi model dan menjalankan aksi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/auth-context';
import { useUserPraktikan } from '@/screens/praktikan/guard';
import { bukaRiwayat } from '@/screens/praktikan/navigasi';
import { usePresensi } from '@/screens/praktikan/use-presensi';
import { Ikon } from '@/screens/praktikan/components/ikon';
import { Kosong } from '@/screens/praktikan/components/kosong';
import { Layar } from '@/screens/praktikan/components/layar';
import { PresensiKartuLokasi } from '@/screens/praktikan/components/presensi-kartu-lokasi';
import { PresensiKartuSesi } from '@/screens/praktikan/components/presensi-kartu-sesi';
import { PresensiKartuStatus } from '@/screens/praktikan/components/presensi-kartu-status';
import { PresensiKonfirmasi } from '@/screens/praktikan/components/presensi-konfirmasi';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { tahapLokasi, type PresensiAksi, type PresensiViewModel } from '@/screens/praktikan/presensi-model';
import { typography, useTheme } from '@/theme';

const SEMUA_TEPI = ['top', 'left', 'right', 'bottom'] as const;

function kembali() {
  if (router.canGoBack()) router.back();
  else router.replace('/(praktikan)');
}

export default function PresensiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const user = useUserPraktikan();
  const { model, onAksiLokasi, onKirim, onMuatUlang } = usePresensi(id ?? '', profile);

  if (!user) return null;

  return (
    <PresensiTampilan
      model={model}
      aksi={{ onKembali: kembali, onAksiLokasi, onKirim, onMuatUlang, onLihatRiwayat: bukaRiwayat }}
    />
  );
}

export function PresensiTampilan({ model, aksi }: { model: PresensiViewModel; aksi: PresensiAksi }) {
  const theme = useTheme();
  const [sheetTampil, setSheetTampil] = useState(false);
  const { sesi, kelayakan, kirim } = model;

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={aksi.onKembali}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        style={({ pressed }) => [styles.kembali, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Ikon nama="kembali" ukuran={20} warna={theme.colors.onHero} />
      </Pressable>
      <Text accessibilityRole="header" style={[typography.sectionTitle, styles.judulHeader, { color: theme.colors.onHero }]}>
        Presensi
      </Text>
      <View style={styles.penyeimbang} />
    </View>
  );

  if (model.galatMuat) {
    return (
      <Layar edges={SEMUA_TEPI}>
        {header}
        <Kosong
          ikon="jadwal"
          judul="Sesi belum bisa dimuat"
          keterangan={model.galatMuat}
          aksi={{ label: 'Muat ulang', onPress: aksi.onMuatUlang }}
        />
      </Layar>
    );
  }

  if (sesi === undefined) {
    return (
      <Layar edges={SEMUA_TEPI}>
        {header}
        <LoadingState message="Memuat sesi..." />
      </Layar>
    );
  }

  if (sesi === null) {
    return (
      <Layar edges={SEMUA_TEPI}>
        {header}
        <Kosong
          ikon="jadwal"
          judul="Sesi tidak ditemukan"
          keterangan="Sesi yang kamu buka tidak ada di jadwal."
          aksi={{ label: 'Kembali', onPress: aksi.onKembali }}
        />
      </Layar>
    );
  }

  const sudahTercatat = model.catatan !== null || kirim.tahap === 'berhasil';
  const mengirim = kirim.tahap === 'mengirim';
  const bisaKirim = kelayakan.tombolAktif && !mengirim;
  const labelKirim = mengirim ? 'Mengirim presensi' : kirim.tahap === 'gagal' ? 'Coba presensi lagi' : 'Presensi sekarang';

  const konfirmasi = () => {
    setSheetTampil(false);
    aksi.onKirim();
  };

  const footer = (
    <View style={styles.footer}>
      {sudahTercatat ? (
        <Tombol label="Lihat riwayat kehadiran" varian="lembut" panah onPress={aksi.onLihatRiwayat} />
      ) : (
        <>
          <Tombol
            label={labelKirim}
            disabled={!bisaKirim}
            petunjuk={bisaKirim ? undefined : kelayakan.alasan}
            onPress={() => setSheetTampil(true)}
          />
          {bisaKirim || mengirim ? null : (
            <Text style={[typography.caption, styles.tengah, { color: theme.colors.textSecondary }]}>
              {kelayakan.alasan}
            </Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <Layar
      edges={SEMUA_TEPI}
      footer={footer}
      sembunyikan={sheetTampil}
      overlay={
        <PresensiKonfirmasi
          visible={sheetTampil}
          onKonfirmasi={konfirmasi}
          onBatal={() => setSheetTampil(false)}
        />
      }
    >
      {header}
      <PresensiKartuSesi sesi={sesi} />
      {!sudahTercatat && tahapLokasi(kelayakan.state) ? (
        <PresensiKartuLokasi
          kelayakan={kelayakan}
          ukuran={model.ukuran}
          onAksi={aksi.onAksiLokasi}
        />
      ) : null}
      <PresensiKartuStatus
        status={sesi.status}
        catatan={model.catatan}
        kirim={kirim}
        laboratorium={sesi.laboratorium}
      />
    </Layar>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  // Area sentuh 44 px, sama dengan Detail Sesi.
  kembali: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  judulHeader: { flex: 1, textAlign: 'center' },
  penyeimbang: { width: 44 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, width: '100%', maxWidth: 648, alignSelf: 'center', gap: 8 },
  tengah: { textAlign: 'center' },
});
