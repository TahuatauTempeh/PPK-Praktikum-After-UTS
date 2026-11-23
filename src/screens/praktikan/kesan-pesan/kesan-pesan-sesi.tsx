/**
 * Kartu Kesan dan pesan di Detail Sesi praktikan. Hanya dirender untuk sesi yang sudah ditutup dan
 * presensinya tercatat; service dan rules tetap mengecek ulang kedua syarat itu sebelum menyimpan.
 *
 * Form dibuka di dalam kartu, bukan BottomSheet, supaya kolom teks tidak tertutup keyboard.
 * Label AI hanya ditampilkan ke asisten, supaya penilaian AI tidak memengaruhi isian praktikan.
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  TEKS_MAKS,
  TEKS_MIN,
  kirimKesanPesan,
  pantauKesanPesanSaya,
  pesanGalatKesanPesan,
  type KesanPesan,
} from '@/lib/kesan-pesan-service';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { formatWaktuIzin } from '@/screens/shared/izin';
import { fonts, typography, useTheme } from '@/theme';
import type { User } from '@/types';

interface KesanPesanSesiProps {
  sessionId: string;
  user: Pick<User, 'id' | 'name'>;
}

export function KesanPesanSesi({ sessionId, user }: KesanPesanSesiProps) {
  const theme = useTheme();
  const [kesanPesan, setKesanPesan] = useState<KesanPesan | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [galatMuat, setGalatMuat] = useState<string | null>(null);
  const [formTampil, setFormTampil] = useState(false);
  const [teks, setTeks] = useState('');
  const [galatTeks, setGalatTeks] = useState('');
  const [galatKirim, setGalatKirim] = useState('');
  const [mengirim, setMengirim] = useState(false);
  // state bisa basi sampai render ulang, jadi ketukan ganda dicegah lewat ref
  const sedangKirim = useRef(false);

  useEffect(
    () =>
      pantauKesanPesanSaya(
        user.id,
        (daftar) => {
          setKesanPesan(daftar.find((item) => item.sessionId === sessionId) ?? null);
          setGalatMuat(null);
          setMemuat(false);
        },
        (pesan) => {
          setGalatMuat(pesan);
          setMemuat(false);
        }
      ),
    [user.id, sessionId]
  );

  const kirim = async () => {
    if (sedangKirim.current) return;
    if (teks.trim().length < TEKS_MIN) {
      setGalatTeks(`Kesan pesan minimal ${TEKS_MIN} karakter.`);
      return;
    }
    sedangKirim.current = true;
    setMengirim(true);
    setGalatKirim('');
    try {
      await kirimKesanPesan({ sessionId, userId: user.id, userName: user.name, text: teks });
      setTeks('');
      setFormTampil(false);
    } catch (error) {
      setGalatKirim(pesanGalatKesanPesan(error));
    } finally {
      sedangKirim.current = false;
      setMengirim(false);
    }
  };

  // Isian hanya dikenali dari garisnya, jadi memakai garis tegas DESIGN.md 4.2, sama dengan form izin.
  const garisTegas = theme.scheme === 'dark' ? '#6B7280' : '#7488A8';
  const kartu = [
    styles.kartu,
    { backgroundColor: theme.colors.glassCard, borderColor: theme.colors.glassBorder, boxShadow: theme.colors.shadow },
  ];

  if (memuat) {
    return (
      <View style={kartu}>
        <Text style={[typography.body, { color: theme.colors.textSecondary }]}>Memuat kesan pesan...</Text>
      </View>
    );
  }

  if (galatMuat) {
    return (
      <View style={kartu}>
        <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme.colors.errorSoft }]}>
          <Text style={[typography.body, { color: theme.colors.error }]}>Kesan pesan gagal dimuat. {galatMuat}</Text>
        </View>
      </View>
    );
  }

  if (kesanPesan) {
    return (
      <View style={kartu}>
        <View style={styles.teks}>
          <Text accessibilityRole="header" style={[typography.sectionTitle, { color: theme.colors.textPrimary }]}>
            Kesan dan pesan kamu
          </Text>
          <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
            Dikirim {formatWaktuIzin(kesanPesan.createdAt)}
          </Text>
        </View>
        <Text style={[typography.body, { color: theme.colors.textPrimary }]}>{kesanPesan.text}</Text>
      </View>
    );
  }

  return (
    <View style={kartu}>
      <View style={styles.teks}>
        <Text accessibilityRole="header" style={[typography.sectionTitle, { color: theme.colors.textPrimary }]}>
          Kesan dan pesan
        </Text>
        <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
          Bagikan kesan dan pesanmu untuk sesi ini. Asisten membacanya untuk memperbaiki sesi berikutnya.
        </Text>
      </View>

      {formTampil ? (
        <>
          <View style={styles.kolom}>
            <Text style={[typography.caption, styles.tebal, { color: theme.colors.textPrimary }]}>Kesan dan pesan</Text>
            <TextInput
              accessibilityLabel="Kesan dan pesan"
              aria-required
              aria-invalid={!!galatTeks}
              value={teks}
              onChangeText={(nilai) => {
                setTeks(nilai);
                if (galatTeks && nilai.trim().length >= TEKS_MIN) setGalatTeks('');
                setGalatKirim('');
              }}
              placeholder="Contoh: Materinya jelas, semoga waktu praktiknya ditambah"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              maxLength={TEKS_MAKS}
              textAlignVertical="top"
              style={[
                styles.isian,
                typography.body,
                {
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.surface,
                  borderColor: galatTeks ? theme.colors.error : garisTegas,
                },
              ]}
            />
            <View style={styles.barisBantu}>
              <Text
                accessibilityRole={galatTeks ? 'alert' : undefined}
                style={[typography.caption, styles.lentur, { color: galatTeks ? theme.colors.error : theme.colors.textSecondary }]}
              >
                {galatTeks || `Minimal ${TEKS_MIN} karakter.`}
              </Text>
              <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
                {teks.length}/{TEKS_MAKS}
              </Text>
            </View>
          </View>

          {galatKirim ? (
            <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme.colors.errorSoft }]}>
              <Text style={[typography.body, { color: theme.colors.error }]}>{galatKirim}</Text>
            </View>
          ) : null}

          <View style={styles.aksi}>
            <Tombol label={mengirim ? 'Mengirim...' : 'Kirim kesan pesan'} disabled={mengirim} onPress={kirim} />
            <Tombol
              label="Batal"
              varian="lembut"
              disabled={mengirim}
              onPress={() => {
                setFormTampil(false);
                setGalatTeks('');
                setGalatKirim('');
              }}
            />
          </View>
        </>
      ) : (
        <Tombol label="Tulis kesan pesan" varian="lembut" onPress={() => setFormTampil(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: { padding: 18, gap: 16, borderRadius: 28, borderWidth: 1 },
  teks: { gap: 4 },
  kolom: { gap: 6 },
  tebal: { fontFamily: fonts.semibold },
  isian: { minHeight: 112, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12 },
  barisBantu: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  lentur: { flex: 1, minWidth: 0 },
  notice: { borderRadius: 16, padding: 14 },
  aksi: { gap: 10 },
});
