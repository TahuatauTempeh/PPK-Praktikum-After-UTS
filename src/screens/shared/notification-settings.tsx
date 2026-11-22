/**
 * Komponen kartu pengaturan dan status notifikasi untuk Layar Profil (Sprint 3 - Dev 4).
 * Menampilkan status izin (Aktif, Belum diizinkan, Ditolak, Tidak didukung, Gagal),
 * tombol tindakan, dan keterangan pemberitahuan sesuai panduan DESIGN.md.
 */

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useNotifications } from '@/context/notification-context';
import { Ikon } from '@/screens/praktikan/components/ikon';
import { radius, typography, useTheme } from '@/theme';
import type { NotificationStatus } from '@/types';

interface StatusConfig {
  label: string;
  dotColor: string;
  badgeBg: string;
  textColor: string;
}

export function NotificationSettings(): React.JSX.Element {
  const theme = useTheme();
  const { status, enableNotifications, openSettings, refresh } = useNotifications();

  const getStatusConfig = (s: NotificationStatus): StatusConfig => {
    switch (s) {
      case 'granted':
        return {
          label: 'Aktif',
          dotColor: theme.colors.success,
          badgeBg: theme.colors.successSoft,
          textColor: theme.colors.success,
        };
      case 'blocked':
        return {
          label: 'Ditolak',
          dotColor: theme.colors.error,
          badgeBg: theme.colors.errorSoft,
          textColor: theme.colors.error,
        };
      case 'unsupported':
        return {
          label: 'Tidak didukung',
          dotColor: theme.colors.iconMuted,
          badgeBg: theme.colors.neutralSoft,
          textColor: theme.colors.textSecondary,
        };
      case 'error':
        return {
          label: 'Gagal',
          dotColor: theme.colors.error,
          badgeBg: theme.colors.errorSoft,
          textColor: theme.colors.error,
        };
      case 'requesting':
        return {
          label: 'Memeriksa...',
          dotColor: theme.colors.primary,
          badgeBg: theme.colors.primarySoft,
          textColor: theme.colors.primary,
        };
      case 'denied':
      case 'idle':
      default:
        return {
          label: 'Belum diizinkan',
          dotColor: theme.colors.iconMuted,
          badgeBg: theme.colors.neutralSoft,
          textColor: theme.colors.textSecondary,
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <View style={styles.bagian}>
      <Text style={[typography.eyebrow, { color: theme.colors.textSecondary }]}>NOTIFIKASI</Text>

      <View
        style={[
          styles.kartuInfo,
          {
            backgroundColor: theme.colors.glassCard,
            borderColor: theme.colors.glassBorder,
            boxShadow: theme.colors.shadow,
          },
        ]}
      >
        <View style={styles.baris}>
          <Text style={[typography.label, { color: theme.colors.textPrimary }]}>Status</Text>
          <View style={[styles.badge, { backgroundColor: statusConfig.badgeBg }]}>
            <View style={[styles.dot, { backgroundColor: statusConfig.dotColor }]} />
            <Text style={[typography.caption, { color: statusConfig.textColor, fontWeight: '600' }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.keteranganBox}>
          <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
            {status === 'unsupported'
              ? 'Notifikasi push tidak didukung pada browser atau perangkat tanpa layanan push.'
              : status === 'error'
                ? 'Notifikasi belum aktif. Perubahan tetap terlihat saat aplikasi dibuka.'
                : 'Dapatkan pemberitahuan otomatis saat sesi dibuka, jadwal praktikum berubah, dan pengajuan izin diputuskan.'}
          </Text>
        </View>

        {status === 'requesting' && (
          <View style={styles.loadingAksi}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[typography.caption, { color: theme.colors.textSecondary }]}>
              Menghubungkan ke layanan notifikasi...
            </Text>
          </View>
        )}

        {(status === 'denied' || status === 'idle') && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aktifkan notifikasi"
            accessibilityHint="Meminta izin untuk mengirim push notification"
            onPress={() => void enableNotifications()}
            style={({ pressed }) => [
              styles.tombolAksi,
              { backgroundColor: theme.colors.primaryFill },
              pressed && styles.ditekan,
            ]}
          >
            <Ikon nama="jadwal" ukuran={16} warna={theme.colors.onPrimary} />
            <Text style={[typography.label, { color: theme.colors.onPrimary }]}>Aktifkan notifikasi</Text>
          </Pressable>
        )}

        {status === 'blocked' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka pengaturan notifikasi"
            accessibilityHint="Membuka pengaturan sistem perangkat untuk mengizinkan notifikasi"
            onPress={() => void openSettings()}
            style={({ pressed }) => [
              styles.tombolAksi,
              { backgroundColor: theme.colors.primarySoft },
              pressed && styles.ditekan,
            ]}
          >
            <Ikon nama="profil" ukuran={16} warna={theme.colors.primary} />
            <Text style={[typography.label, { color: theme.colors.primary }]}>Buka pengaturan</Text>
          </Pressable>
        )}

        {status === 'error' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Coba lagi mengaktifkan notifikasi"
            onPress={() => void refresh()}
            style={({ pressed }) => [
              styles.tombolAksi,
              { backgroundColor: theme.colors.errorFill },
              pressed && styles.ditekan,
            ]}
          >
            <Text style={[typography.label, { color: theme.colors.onError }]}>Coba lagi</Text>
          </Pressable>
        )}
      </View>
    </View>
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
    borderRadius: radius.card, // 28
    padding: 16,
    gap: 12,
  },
  baris: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  keteranganBox: {
    paddingVertical: 2,
  },
  loadingAksi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  tombolAksi: {
    minHeight: 44,
    borderRadius: radius.button, // 21
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  ditekan: {
    opacity: 0.85,
  },
});
