/**
 * Profil pengguna: kartu identitas, email akun, dan keluar (UC-12).
 * Satu layar untuk praktikan dan asisten; bahasa visualnya mengikuti sisi praktikan
 * supaya kedua role melihat halaman yang sama.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { Ikon } from '@/screens/praktikan/components/ikon';
import { Layar } from '@/screens/praktikan/components/layar';
import { KartuProfil } from '@/screens/shared/components/kartu-profil';
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
  const appTheme = useTheme();
  const { profile, signOut } = useAuth();
  const [konfirmasi, setKonfirmasi] = useState(false);

  if (!profile) return <LoadingState message="Memuat profil..." />;

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
            <BarisInfo label="Email" nilai={profile.email || '—'} />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keluar dari akun"
          accessibilityHint="Membuka konfirmasi untuk keluar dari akun"
          onPress={() => setKonfirmasi(true)}
          style={({ pressed }) => [
            styles.keluar,
            // Mengikuti isian tombol konfirmasi ConfirmModal, bukan palet praktikan.
            { backgroundColor: appTheme.dangerFill },
            pressed && styles.ditekan,
          ]}
        >
          <Text style={[Tipe.label, { color: appTheme.onDanger }]}>Keluar dari akun</Text>
          <Ikon nama="keluar" ukuran={18} warna={appTheme.onDanger} />
        </Pressable>
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
  keluar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 21,
  },
  ditekan: {
    opacity: 0.8,
  },
});
