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
import { useThemePreference } from '@/context/theme-context';
import { Ikon } from '@/screens/praktikan/components/ikon';
import { Layar } from '@/screens/praktikan/components/layar';
import { KartuProfil } from '@/screens/shared/components/kartu-profil';
import { PemilihTema } from '@/screens/shared/components/pemilih-tema';
import { typography, useTheme } from '@/theme';

function BarisInfo({ label, nilai }: { label: string; nilai: string }) {
  const theme = useTheme();

  return (
    <View style={styles.baris}>
      <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text numberOfLines={2} style={[typography.label, styles.nilai, { color: theme.colors.textPrimary }]}>
        {nilai}
      </Text>
    </View>
  );
}

export default function ProfilScreen() {
  const theme = useTheme();
  const { mode, setMode } = useThemePreference();
  const { profile, signOut } = useAuth();
  const [konfirmasi, setKonfirmasi] = useState(false);

  if (!profile) return <LoadingState message="Memuat profil..." />;

  // Admin bukan role terpisah; badge menampilkan status admin, bukan role dasarnya.
  const peran = profile.isAdmin
    ? 'Admin'
    : profile.role === 'praktikan'
      ? 'Praktikan'
      : 'Asisten';

  return (
    <>
      <Layar>
        <KartuProfil
          nama={profile.name}
          nomor={profile.nim}
          peran={peran}
        />

        <View style={styles.bagian}>
          <Text style={[typography.eyebrow, { color: theme.colors.textSecondary }]}>INFORMASI AKUN</Text>

          <View
            style={[
              styles.kartuInfo,
              { backgroundColor: theme.colors.glassCard, borderColor: theme.colors.glassBorder, boxShadow: theme.colors.shadow },
            ]}
          >
            <BarisInfo label="Email" nilai={profile.email || '—'} />
          </View>
        </View>

        <View style={styles.bagian}>
          <Text style={[typography.eyebrow, { color: theme.colors.textSecondary }]}>TAMPILAN</Text>

          <View
            style={[
              styles.kartuInfo,
              styles.kartuTema,
              { backgroundColor: theme.colors.glassCard, borderColor: theme.colors.glassBorder, boxShadow: theme.colors.shadow },
            ]}
          >
            <View style={styles.barisTampilan}>
              <Text style={[typography.label, { color: theme.colors.textPrimary }]}>Tema</Text>
              <PemilihTema nilai={mode} onPilih={setMode} />
            </View>
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
            { backgroundColor: theme.colors.errorFill },
            pressed && styles.ditekan,
          ]}
        >
          <Text style={[typography.label, { color: theme.colors.onError }]}>Keluar</Text>
          <Ikon nama="keluar" ukuran={18} warna={theme.colors.onError} />
        </Pressable>
      </Layar>

      <ConfirmModal
        visible={konfirmasi}
        title="Keluar?"
        message="Anda akan keluar dari akun ini."
        confirmText="Ya"
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
  barisTampilan: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  kartuTema: {
    paddingHorizontal: 0,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 999,
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
