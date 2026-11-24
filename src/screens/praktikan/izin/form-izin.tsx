/**
 * Form izin (task 4.1): pilih sesi lewat BottomSheet, tulis alasan, kirim.
 * Sesi yang sudah ditutup tetap bisa dipilih (task 4.8). Sesi yang sudah punya izin ditandai
 * dan tidak bisa dipilih lagi; service tetap mengecek ulang ke Firestore sebelum menyimpan.
 * Saat offline izin tetap disimpan sebagai pending dan terkirim otomatis begitu online (task 4.8).
 */

import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { ALASAN_MAKS, ALASAN_MIN, ajukanIzin, pesanGalatIzin } from '@/lib/permission-service';
import { Ikon } from '@/screens/praktikan/components/ikon';
import { StatusLabel } from '@/screens/praktikan/components/status-label';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { formatTanggalPendek } from '@/screens/praktikan/format';
import { namaSesi } from '@/screens/shared/izin';
import { fonts, typography, useTheme } from '@/theme';
import type { Session, User } from '@/types';

interface FormIzinProps {
  user: User;
  sessions: Session[];
  sesiBerizin: ReadonlySet<string>;
  memuatSesi: boolean;
  galatSesi: string | null;
  muatUlangSesi: () => void;
}

type Hasil = { jenis: 'sukses' | 'galat'; pesan: string } | null;

export function FormIzin({ user, sessions, sesiBerizin, memuatSesi, galatSesi: galatJadwal, muatUlangSesi }: FormIzinProps) {
  const theme = useTheme();
  const [sessionId, setSessionId] = useState('');
  const [alasan, setAlasan] = useState('');
  const [galatSesi, setGalatSesi] = useState('');
  const [galatAlasan, setGalatAlasan] = useState('');
  const [hasil, setHasil] = useState<Hasil>(null);
  const [pemilihTampil, setPemilihTampil] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  // state bisa basi sampai render ulang, jadi ketukan ganda dicegah lewat ref
  const sedangKirim = useRef(false);

  const terpilih = sessions.find((s) => s.id === sessionId);
  const panjang = alasan.trim().length;

  const pilih = (id: string) => {
    setSessionId(id);
    setGalatSesi('');
    setHasil(null);
    setPemilihTampil(false);
  };

  const kirim = async () => {
    if (sedangKirim.current) return;
    const pesanSesi = !sessionId ? 'Pilih sesi yang tidak bisa kamu hadiri.' : '';
    const pesanAlasan = panjang < ALASAN_MIN ? `Alasan minimal ${ALASAN_MIN} karakter.` : '';
    setGalatSesi(pesanSesi);
    setGalatAlasan(pesanAlasan);
    setHasil(null);
    if (pesanSesi || pesanAlasan) return;

    sedangKirim.current = true;
    setMengirim(true);
    try {
      const { izin, tertunda } = await ajukanIzin({
        sessionId,
        userId: user.id,
        userName: user.name,
        reason: alasan,
        sesiBerizin,
      });
      setSessionId('');
      setAlasan('');
      const status = tertunda
        ? 'Kamu sedang offline. Izin disimpan di perangkat dan terkirim otomatis saat koneksi kembali.'
        : 'Izin terkirim dan menunggu tinjauan asisten.';
      setHasil({
        jenis: 'sukses',
        pesan: izin.aiLabel ? status : `${status} Hasil AI tidak tersedia untuk alasan ini.`,
      });
    } catch (error) {
      setHasil({ jenis: 'galat', pesan: pesanGalatIzin(error) });
    } finally {
      sedangKirim.current = false;
      setMengirim(false);
    }
  };

  // isian hanya dikenali dari garisnya, jadi memakai garis tegas DESIGN.md 4.2, bukan token border dekoratif
  const garisTegas = theme.scheme === 'dark' ? '#6B7280' : '#7488A8';
  const bingkaiIsian = (adaGalat: boolean) => ({
    backgroundColor: theme.colors.surface,
    borderColor: adaGalat ? theme.colors.error : garisTegas,
  });

  return (
    <View
      style={[
        styles.kartu,
        { backgroundColor: theme.colors.glassCard, borderColor: theme.colors.glassBorder, boxShadow: theme.colors.shadow },
      ]}
    >
      <View style={styles.teks}>
        <Text accessibilityRole="header" style={[typography.sectionTitle, { color: theme.colors.textPrimary }]}>
          Ajukan izin
        </Text>
        <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
          Asisten meninjau setiap izin. Status berubah otomatis di riwayat.
        </Text>
      </View>

      <View style={styles.kolom}>
        <Text style={[typography.caption, styles.tebal, { color: theme.colors.textPrimary }]}>Sesi</Text>
        <Pressable
          testID="izin-sesi"
          accessibilityRole="button"
          accessibilityLabel={terpilih ? `Sesi: ${namaSesi(terpilih)}. Ganti sesi` : 'Pilih sesi'}
          aria-required
          aria-invalid={!!galatSesi}
          onPress={() => setPemilihTampil(true)}
          style={({ pressed }) => [styles.isian, styles.barisIsian, bingkaiIsian(!!galatSesi), pressed && styles.ditekan]}
        >
          <Ikon nama="jadwal" ukuran={16} warna={theme.colors.textSecondary} />
          <View style={styles.isiPilihan}>
            <Text
              numberOfLines={1}
              style={[typography.body, { color: terpilih ? theme.colors.textPrimary : theme.colors.textSecondary }]}
            >
              {terpilih ? namaSesi(terpilih) : 'Pilih sesi'}
            </Text>
            {terpilih ? (
              <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
                {formatTanggalPendek(terpilih.date)}
              </Text>
            ) : null}
          </View>
          <Text style={[typography.caption, styles.tebal, { color: theme.colors.primary }]}>
            {terpilih ? 'Ganti' : 'Pilih'}
          </Text>
        </Pressable>
        {galatSesi ? (
          <Text accessibilityRole="alert" style={[typography.caption, { color: theme.colors.error }]}>
            {galatSesi}
          </Text>
        ) : null}
      </View>

      <View style={styles.kolom}>
        <Text style={[typography.caption, styles.tebal, { color: theme.colors.textPrimary }]}>Alasan</Text>
        <TextInput
          testID="izin-alasan"
          accessibilityLabel="Alasan izin"
          aria-required
          aria-invalid={!!galatAlasan}
          value={alasan}
          onChangeText={(nilai) => {
            setAlasan(nilai);
            if (galatAlasan && nilai.trim().length >= ALASAN_MIN) setGalatAlasan('');
            setHasil(null);
          }}
          placeholder="Contoh: Saya dirawat di rumah sakit sejak kemarin"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={ALASAN_MAKS}
          textAlignVertical="top"
          style={[styles.isian, styles.alasan, typography.body, bingkaiIsian(!!galatAlasan), { color: theme.colors.textPrimary }]}
        />
        <View style={styles.barisBantu}>
          <Text
            accessibilityRole={galatAlasan ? 'alert' : undefined}
            style={[typography.caption, styles.lentur, { color: galatAlasan ? theme.colors.error : theme.colors.textSecondary }]}
          >
            {galatAlasan || `Minimal ${ALASAN_MIN} karakter.`}
          </Text>
          <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
            {alasan.length}/{ALASAN_MAKS}
          </Text>
        </View>
      </View>

      {hasil ? (
        <View
          accessibilityRole="alert"
          style={[styles.notice, { backgroundColor: hasil.jenis === 'sukses' ? theme.colors.successSoft : theme.colors.errorSoft }]}
        >
          <Text style={[typography.body, { color: hasil.jenis === 'sukses' ? theme.colors.success : theme.colors.error }]}>
            {hasil.pesan}
          </Text>
        </View>
      ) : null}

      <Tombol testID="izin-kirim" label={mengirim ? 'Mengirim izin...' : 'Kirim izin'} disabled={mengirim} onPress={kirim} />

      <BottomSheet visible={pemilihTampil} title="Pilih sesi" onClose={() => setPemilihTampil(false)}>
        <ScrollView style={styles.daftarSesi} contentContainerStyle={styles.isiDaftar}>
          {memuatSesi ? (
            <Text style={[typography.body, styles.tengah, { color: theme.colors.textSecondary }]}>
              Memuat sesi...
            </Text>
          ) : galatJadwal ? (
            <View style={styles.galatJadwal}>
              <Text accessibilityRole="alert" style={[typography.body, styles.tengah, { color: theme.colors.error }]}>
                {galatJadwal}
              </Text>
              <Tombol label="Coba lagi" varian="lembut" onPress={muatUlangSesi} />
            </View>
          ) : sessions.length === 0 ? (
            <Text style={[typography.body, styles.tengah, { color: theme.colors.textSecondary }]}>
              Belum ada sesi. Sesi muncul setelah asisten menambahkanmu ke kelas.
            </Text>
          ) : null}
          {sessions.map((s) => {
            const berizin = sesiBerizin.has(s.id);
            const aktif = s.id === sessionId;
            return (
              <Pressable
                key={s.id}
                testID={`izin-sesi-${s.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${namaSesi(s)}, ${formatTanggalPendek(s.date)}${berizin ? ', izin sudah diajukan' : ''}`}
                accessibilityState={{ disabled: berizin, selected: aktif }}
                disabled={berizin}
                onPress={() => pilih(s.id)}
                style={({ pressed }) => [
                  styles.opsi,
                  {
                    backgroundColor: aktif ? theme.colors.primarySoft : theme.colors.background,
                    borderColor: aktif ? theme.colors.primary : theme.colors.border,
                  },
                  pressed && styles.ditekan,
                ]}
              >
                <View style={styles.lentur}>
                  <Text style={[typography.label, { color: berizin ? theme.colors.textSecondary : theme.colors.textPrimary }]}>
                    {namaSesi(s)}
                  </Text>
                  <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
                    {berizin ? `${formatTanggalPendek(s.date)} · Izin sudah diajukan` : formatTanggalPendek(s.date)}
                  </Text>
                </View>
                <StatusLabel status={s.status} />
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: { padding: 18, gap: 16, borderRadius: 28, borderWidth: 1 },
  teks: { gap: 4 },
  kolom: { gap: 6 },
  tebal: { fontFamily: fonts.semibold },
  isian: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14 },
  barisIsian: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  isiPilihan: { flex: 1, minWidth: 0 },
  alasan: { minHeight: 112, paddingTop: 12, paddingBottom: 12 },
  barisBantu: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  lentur: { flex: 1, minWidth: 0 },
  notice: { borderRadius: 16, padding: 14 },
  ditekan: { opacity: 0.7 },
  daftarSesi: { maxHeight: 420 },
  isiDaftar: { gap: 8, paddingBottom: 8 },
  opsi: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 20,
  },
  tengah: { textAlign: 'center' },
  galatJadwal: { gap: 12 },
});
