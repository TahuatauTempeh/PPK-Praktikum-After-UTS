/**
 * Role Select Screen — Layar pertama: pilih peran Praktikan atau Asisten.
 * UC-01: Pilih peran dan identitas (bagian 1)
 */

import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function RoleSelectScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📋</Text>
          <Text style={[styles.title, { color: theme.text }]}>Presensi Praktikum</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Pilih peran Anda untuk melanjutkan
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* Praktikan Card */}
          <Pressable
            onPress={() => router.push('/select-user?role=praktikan')}
            style={({ pressed }) => [
              styles.roleCard,
              {
                backgroundColor: theme.primaryLight,
                borderColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={styles.roleEmoji}>🎓</Text>
            <Text style={[styles.roleTitle, { color: theme.primary }]}>Praktikan</Text>
            <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
              Lihat jadwal, lakukan presensi, dan cek riwayat kehadiran
            </Text>
          </Pressable>

          {/* Asisten Card */}
          <Pressable
            onPress={() => router.push('/select-user?role=asisten')}
            style={({ pressed }) => [
              styles.roleCard,
              {
                backgroundColor: theme.successLight,
                borderColor: theme.success,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={styles.roleEmoji}>👨‍🏫</Text>
            <Text style={[styles.roleTitle, { color: theme.success }]}>Asisten</Text>
            <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
              Kelola sesi, buka/tutup presensi, dan lihat rekap kehadiran
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          Praktikum PPK — Kelompok Reshuffle
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: 32,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
  },
  roleCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 8,
  },
  roleEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  roleDesc: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
