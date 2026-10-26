/**
 * Profil Asisten — Menampilkan info user dan tombol Ganti Peran (UC-12).
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/components/ConfirmModal';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/context/session-context';
import { useTheme } from '@/hooks/use-theme';

export default function ProfilAsistenScreen() {
  const theme = useTheme();
  const { state, logout } = useSession();
  const { currentUser } = state;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    router.replace('/');
  };

  if (!currentUser) return null;

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: theme.successLight }]}>
            <Text style={[styles.avatarText, { color: theme.success }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{currentUser.name}</Text>
          <Text style={[styles.nim, { color: theme.textSecondary }]}>{currentUser.nim}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.successLight }]}>
            <Text style={[styles.roleText, { color: theme.success }]}>👨‍🏫 Asisten</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Nama</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{currentUser.name}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Kode</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{currentUser.nim}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Peran</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>Asisten</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => setShowLogoutModal(true)}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: theme.dangerLight,
                borderColor: theme.danger,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.logoutText, { color: theme.danger }]}>🔄 Ganti Peran</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={showLogoutModal}
        title="Ganti Peran?"
        message="Anda akan keluar dan kembali ke halaman pemilihan peran."
        confirmText="Ya, Ganti"
        cancelText="Batal"
        confirmColor="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    gap: 16,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  nim: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  actions: {
    marginTop: 'auto',
    paddingBottom: Spacing.three,
  },
  logoutButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
