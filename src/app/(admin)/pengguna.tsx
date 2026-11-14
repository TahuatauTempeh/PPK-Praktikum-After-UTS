import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { ConfirmModal } from '@/components/ConfirmModal';
import { ScreenState } from '@/components/ScreenState';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { logActionInBatch } from '@/lib/firebase/audit';
import { toUserProfile } from '@/lib/firebase/converters';
import { mapFirebaseError } from '@/lib/firebase/errors';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import { useTheme } from '@/hooks/use-theme';
import type { Role, UserProfile } from '@/types';

type Filter = 'all' | Role;

export default function AdminUsersScreen() {
  const theme = useTheme();
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<UserProfile | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(getDb(), COLLECTIONS.users), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setUsers(snapshot.docs.map((item) => toUserProfile(item)));
        setLoading(false);
      },
      (snapshotError) => {
        setError(mapFirebaseError(snapshotError).message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [retryKey]);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter = filter === 'all' || user.role === filter;
      const matchesSearch =
        !term ||
        [user.name, user.email, user.nim].some((value) =>
          value.toLowerCase().includes(term)
        );
      return matchesFilter && matchesSearch;
    });
  }, [users, filter, search]);

  const canChange = (user: UserProfile) =>
    !!profile?.isAdmin && user.id !== profile.id && !user.isAdmin;

  const changeRole = async (target: UserProfile) => {
    if (!profile?.isAdmin || !canChange(target)) return;

    const nextRole: Role = target.role === 'praktikan' ? 'asisten' : 'praktikan';
    setPendingId(target.id);
    setActionError(null);

    try {
      const batch = writeBatch(getDb());
      batch.update(doc(getDb(), COLLECTIONS.users, target.id), {
        role: nextRole,
        roleUpdatedBy: profile.id,
        roleUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      logActionInBatch(
        batch,
        nextRole === 'asisten' ? 'promote' : 'demote',
        COLLECTIONS.users,
        target.id,
        { role: target.role },
        { role: nextRole }
      );
      await batch.commit();
      setConfirmTarget(null);
    } catch (changeError) {
      setActionError(mapFirebaseError(changeError).message);
    } finally {
      setPendingId(null);
    }
  };

  const screenStatus: 'loading' | 'error' | 'empty' | 'ready' = loading
    ? 'loading'
    : error
      ? 'error'
      : visibleUsers.length === 0
        ? 'empty'
        : 'ready';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace(profile?.role === 'asisten' ? '/asisten' : profile?.role === 'praktikan' ? '/(praktikan)' : '/login');
          }}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.primary }]}>‹ Kembali</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Kelola Pengguna</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {users.length} akun terdaftar
        </Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Cari nama, email, atau NIM"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        style={[
          styles.search,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
      />

      <View style={styles.filters}>
        {(['all', 'praktikan', 'asisten'] as const).map((value) => {
          const active = filter === value;
          return (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? theme.primaryFill : theme.backgroundElement,
                  borderColor: active ? theme.primaryFill : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? theme.onPrimary : theme.textSecondary },
                ]}
              >
                {value === 'all' ? 'Semua' : value === 'praktikan' ? 'Praktikan' : 'Asisten'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {actionError ? (
        <Text style={[styles.actionError, { color: theme.danger }]}>{actionError}</Text>
      ) : null}

      <ScreenState
        status={screenStatus}
        loadingMessage="Memuat pengguna..."
        errorMessage={error ?? undefined}
        onRetry={() => {
          setLoading(true);
          setError(null);
          setRetryKey((value) => value + 1);
        }}
        emptyTitle="Tidak ada pengguna"
        emptySubtitle="Coba ubah kata kunci atau filter."
      >
        <FlatList
          data={visibleUsers}
          keyExtractor={(item) => item.id}
          style={styles.listFlex}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        item.role === 'asisten' ? theme.successLight : theme.primaryLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: item.role === 'asisten' ? theme.success : theme.primary },
                    ]}
                  >
                    {item.role}
                  </Text>
                </View>
                {item.isAdmin ? (
                  <View style={[styles.badge, { backgroundColor: theme.warningLight }]}>
                    <Text style={[styles.badgeText, { color: theme.warning }]}>Admin</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {item.nim} · {item.email}
              </Text>
            </View>

            {canChange(item) ? (
              <Pressable
                onPress={() => setConfirmTarget(item)}
                disabled={pendingId === item.id}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor:
                      item.role === 'praktikan' ? theme.primaryLight : theme.warningLight,
                    opacity: pendingId === item.id ? 0.5 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionText,
                    { color: item.role === 'praktikan' ? theme.primary : theme.warning },
                  ]}
                >
                  {item.role === 'praktikan' ? 'Jadikan Asisten' : 'Kembalikan ke Praktikan'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
        />
      </ScreenState>

      <ConfirmModal
        visible={!!confirmTarget}
        title={confirmTarget?.role === 'praktikan' ? 'Jadikan Asisten?' : 'Kembalikan ke Praktikan?'}
        message={
          confirmTarget
            ? confirmTarget.role === 'praktikan'
              ? `${confirmTarget.name} akan mendapat akses fitur asisten.`
              : `${confirmTarget.name} akan kehilangan akses fitur asisten.`
            : ''
        }
        confirmText="Ya, Ubah"
        cancelText="Batal"
        confirmColor={confirmTarget?.role === 'praktikan' ? 'primary' : 'danger'}
        onConfirm={() => {
          if (confirmTarget) void changeRole(confirmTarget);
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    gap: 4,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionError: {
    fontSize: 13,
    fontWeight: '600',
  },
  listFlex: {
    flex: 1,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardInfo: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
