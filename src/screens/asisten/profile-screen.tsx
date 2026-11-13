import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/auth-context';

import { assistantTheme as theme } from './theme';
import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';

/** Profil asisten: identitas, email, dan keluar. */
export function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);

  if (!profile) return <LoadingState message="Memuat profil..." />;

  const initials = profile.name
    .trim()
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AssistantScreen edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AssistantText style={styles.eyebrow}>AKUN</AssistantText>
        <AssistantText variant="pageTitle" accessibilityRole="header">Profil</AssistantText>
      </View>

      <View style={styles.identityCard}>
        <View style={styles.avatar}>
          <AssistantText style={styles.initials}>{initials}</AssistantText>
        </View>
        <AssistantText style={styles.name}>{profile.name}</AssistantText>
        <AssistantText style={styles.code}>{profile.nim}</AssistantText>
        <View style={styles.badge}>
          <AssistantText style={styles.badgeText}>Asisten</AssistantText>
        </View>
      </View>

      <View style={styles.contactSection}>
        <AssistantText style={styles.eyebrow}>KONTAK</AssistantText>
        <View style={styles.contactCard}>
          <AssistantText variant="caption" tone="secondary">Email</AssistantText>
          <AssistantText style={styles.contactValue} numberOfLines={2}>{profile.email}</AssistantText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Keluar"
        onPress={() => setConfirming(true)}
        style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
      >
        <AssistantText style={styles.logoutText}>Keluar</AssistantText>
      </Pressable>

      <ConfirmModal
        visible={confirming}
        title="Keluar?"
        message="Anda akan keluar dari akun ini."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        confirmColor="danger"
        onConfirm={() => {
          setConfirming(false);
          void signOut();
        }}
        onCancel={() => setConfirming(false)}
      />
    </AssistantScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  eyebrow: {
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.4,
    fontFamily: theme.fonts.semibold,
    color: theme.colors.textSecondary,
  },
  identityCard: {
    alignItems: 'center',
    gap: 7,
    padding: 22,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.banner,
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    marginBottom: 4,
  },
  initials: { fontSize: 24, lineHeight: 30, fontFamily: theme.fonts.bold, color: theme.colors.primary },
  name: { fontSize: 19, lineHeight: 26, fontFamily: theme.fonts.bold, letterSpacing: -0.4 },
  code: { fontSize: 13, lineHeight: 18, color: theme.colors.textSecondary },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    marginTop: 2,
  },
  badgeText: { fontSize: 12, lineHeight: 16, fontFamily: theme.fonts.semibold, color: theme.colors.primary },
  contactSection: { gap: 10 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.radius.card,
  },
  contactValue: { flexShrink: 1, fontSize: 13, lineHeight: 18, fontFamily: theme.fonts.semibold, textAlign: 'right' },
  logout: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: theme.colors.errorSoft,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.radius.button,
  },
  logoutText: { fontSize: 14, lineHeight: 20, fontFamily: theme.fonts.semibold, color: theme.colors.error },
  pressed: { opacity: 0.72 },
});
