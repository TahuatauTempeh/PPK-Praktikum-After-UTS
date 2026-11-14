/**
 * Profil Praktikan: kartu identitas, informasi akun, dan keluar (UC-12).
 * Memakai kerangka Layar dan token praktikan supaya satu bahasa dengan Jadwal dan Riwayat.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/auth-context';
import { Ikon } from '@/screens/praktikan/components/ikon';
import { KartuProfil } from '@/screens/praktikan/components/kartu-profil';
import { Layar } from '@/screens/praktikan/components/layar';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

function BarisInfo({ label, nilai }: { label: string; nilai: string }) {
  const theme = usePraktikanTheme();

  return (
    <View style={styles.baris}>
      <Text style={[Tipe.caption, { color: theme.teksSekunder }]}>{label}</Text>
      <Text numberOfLines={2} style={[Tipe.label, styles.nilai, { color: theme.teks }]}>
        {nilai}
      </Text>
    </View>
  );
}

export default function ProfilScreen() {
  const theme = usePraktikanTheme();
  const { profile, signOut } = useAuth();
  const [konfirmasi, setKonfirmasi] = useState(false);

  if (!profile) return <LoadingState message="Memuat profil..." />;

  const bergabung = profile.createdAt
    ? new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }).format(profile.createdAt.toDate())
    : null;
  const adaInfo = Boolean(profile.email || bergabung);

  return (
    <>
      <Layar>
        <KartuProfil
          nama={profile.name}
          nomor={profile.nim}
          peran={profile.role === 'praktikan' ? 'Praktikan' : 'Asisten'}
        />

        <View style={styles.bagian}>
          <Text style={[Tipe.eyebrow, { color: theme.teksSekunder }]}>INFORMASI AKUN</Text>

          <View
            style={[
              styles.kartuInfo,
              { backgroundColor: theme.kartu, borderColor: theme.garisKartu, boxShadow: theme.bayang },
            ]}
          >
            {profile.email ? <BarisInfo label="Email" nilai={profile.email} /> : null}
            {profile.email && bergabung ? (
              <View style={[styles.pemisah, { backgroundColor: theme.pemisah }]} />
            ) : null}
            {bergabung ? <BarisInfo label="Bergabung" nilai={bergabung} /> : null}
            {adaInfo ? <View style={[styles.pemisah, { backgroundColor: theme.pemisah }]} /> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar dari akun"
              accessibilityHint="Membuka konfirmasi untuk keluar dari akun"
              onPress={() => setKonfirmasi(true)}
              style={({ pressed }) => [styles.keluar, pressed && styles.ditekan]}
            >
              <Text style={[Tipe.label, { color: theme.galat }]}>Keluar dari akun</Text>
              <Ikon nama="keluar" ukuran={18} warna={theme.galat} />
            </Pressable>
          </View>
        </View>
      </Layar>

      <ConfirmModal
        visible={konfirmasi}
        title="Keluar?"
        message="Anda akan keluar dari akun ini."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        confirmColor="danger"
        onConfirm={() => {
          setKonfirmasi(false);
          void signOut();
        }}
        onCancel={() => setKonfirmasi(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bagian: {
    gap: 10,
    marginTop: 4,
  },
  kartuInfo: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 16,
  },
  baris: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  nilai: {
    flexShrink: 1,
    maxWidth: '68%',
    textAlign: 'right',
  },
  pemisah: {
    height: 1,
  },
  keluar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  ditekan: {
    opacity: 0.7,
  },
});
