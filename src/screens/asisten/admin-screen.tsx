import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { useAuth } from '@/context/auth-context';
import { logActionInBatch } from '@/lib/firebase/audit';
import { toUserProfile } from '@/lib/firebase/converters';
import { mapFirebaseError } from '@/lib/firebase/errors';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import { HeroCard } from '@/screens/shared/components/hero-card';
import type { Role, UserProfile } from '@/types';

import { AdminRoleConfirmation } from './components/admin-role-confirmation';
import { AssistantSurface } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { ScheduleIcon } from './components/schedule-icon';
import {
  tokens,
  useThemedStyles,
  useTheme,
  type Theme,
} from '@/theme';

type Filter = 'all' | Role;

const filters: readonly { value: Filter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'praktikan', label: 'Praktikan' },
  { value: 'asisten', label: 'Asisten' },
];

/** Kelola pengguna: pencarian, filter peran, dan perubahan role oleh admin. */
export function AdminScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
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
        setError(null);
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

  const counts = useMemo(
    () => ({
      all: users.length,
      praktikan: users.filter((user) => user.role === 'praktikan').length,
      asisten: users.filter((user) => user.role === 'asisten').length,
    }),
    [users]
  );

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

  const metrics = [
    { label: 'Akun', value: loading || error ? '—' : counts.all },
    { label: 'Praktikan', value: loading || error ? '—' : counts.praktikan },
    { label: 'Asisten', value: loading || error ? '—' : counts.asisten },
  ];

  const header = (
    <View style={styles.headerBlock}>
      <HeroCard
        backgroundColor={theme.colors.glassHero}
        watermark={<ScheduleIcon name="usersWhite" size={126} />}
        padding={20}
        gap={12}
      >
        <AssistantText style={styles.eyebrow}>MANAJEMEN AKSES</AssistantText>
        <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.heroTitle}>
          Kelola pengguna
        </AssistantText>
        <View style={styles.metrics} accessibilityLiveRegion="polite">
          {metrics.map((metric, index) => (
            <View
              key={metric.label}
              style={[styles.metric, index < metrics.length - 1 && styles.metricDivider]}
            >
              <AssistantText style={styles.metricValue} numberOfLines={1}>
                {metric.value}
              </AssistantText>
              <AssistantText variant="caption" style={styles.metricLabel}>
                {metric.label}
              </AssistantText>
            </View>
          ))}
        </View>
      </HeroCard>

      <View style={styles.controls}>
        <TextInput
          accessibilityLabel="Cari pengguna"
          value={search}
          onChangeText={setSearch}
          placeholder="Cari nama, email, atau NIM"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={styles.search}
        />

        <View style={styles.filters} accessibilityLabel="Filter peran pengguna">
          {filters.map(({ value, label }) => {
            const active = filter === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`${label}, ${counts[value]} akun`}
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(value)}
                style={({ pressed }) => [
                  styles.filter,
                  active && styles.filterActive,
                  pressed && styles.pressed,
                ]}
              >
                <AssistantText style={[styles.filterLabel, active && styles.filterLabelActive]}>
                  {label}
                </AssistantText>
                <AssistantText style={[styles.filterCount, active && styles.filterCountActive]}>
                  {counts[value]}
                </AssistantText>
              </Pressable>
            );
          })}
        </View>

        {actionError ? (
          <AssistantText accessibilityRole="alert" style={styles.actionError}>
            {actionError}
          </AssistantText>
        ) : null}
      </View>
    </View>
  );

  const emptyState =
    screenStatus === 'loading' ? (
      <View style={styles.state}>
        <ActivityIndicator color={theme.colors.primary} />
        <AssistantText tone="secondary">Memuat pengguna...</AssistantText>
      </View>
    ) : screenStatus === 'error' ? (
      <View style={styles.state} accessibilityRole="alert">
        <AssistantText style={styles.stateTitle}>Gagal memuat pengguna</AssistantText>
        <AssistantText tone="secondary" style={styles.center}>
          {error ?? 'Terjadi kesalahan.'}
        </AssistantText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Coba lagi memuat pengguna"
          onPress={() => {
            setLoading(true);
            setError(null);
            setRetryKey((value) => value + 1);
          }}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <AssistantText variant="label" style={styles.white}>
            Coba lagi
          </AssistantText>
        </Pressable>
      </View>
    ) : (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <ScheduleIcon name="usersPrimary" size={34} tintColor={theme.colors.primary} />
        </View>
        <AssistantText style={styles.emptyTitle} accessibilityRole="header">
          Tidak ada pengguna
        </AssistantText>
        <AssistantText tone="secondary" style={styles.center}>
          Coba ubah kata kunci atau filter.
        </AssistantText>
      </View>
    );

  return (
    <>
      <View
        style={styles.screen}
        aria-hidden={confirmTarget !== null}
        importantForAccessibility={confirmTarget ? 'no-hide-descendants' : 'auto'}
      >
        <AssistantSurface edges={['top', 'left', 'right']}>
          <View style={styles.frame}>
            <FlatList
              data={screenStatus === 'ready' ? visibleUsers : []}
              keyExtractor={(item) => item.id}
              style={styles.listFlex}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListHeaderComponent={header}
              ListEmptyComponent={emptyState}
              renderItem={({ item }) => {
                const asisten = item.role === 'asisten';
                const roleLabel = asisten ? 'Asisten' : 'Praktikan';
                const roleBackground = asisten ? theme.colors.primarySoft : theme.colors.neutralSoft;
                const roleColor = asisten ? theme.colors.primary : theme.colors.textSecondary;
                const pending = pendingId === item.id;

                return (
                  <View style={styles.card}>
                    <View style={styles.cardInfo}>
                      <View style={styles.nameRow}>
                        <AssistantText style={styles.name}>
                          {item.name}
                        </AssistantText>
                        <View style={styles.badges}>
                          <View style={[styles.badge, { backgroundColor: roleBackground }]}>
                            <AssistantText style={[styles.badgeText, { color: roleColor }]}>
                              {roleLabel}
                            </AssistantText>
                          </View>
                          {item.isAdmin ? (
                            <View style={[styles.badge, { backgroundColor: theme.colors.lime }]}>
                              <AssistantText
                                style={[styles.badgeText, { color: theme.colors.onLime }]}
                              >
                                Admin
                              </AssistantText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      <AssistantText
                        variant="caption"
                        tone="secondary"
                        numberOfLines={1}
                        style={styles.meta}
                      >
                        {item.nim} · {item.email}
                      </AssistantText>
                    </View>

                    {canChange(item) ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          asisten
                            ? `Jadikan ${item.name} sebagai Praktikan`
                            : `Jadikan ${item.name} sebagai Asisten`
                        }
                        accessibilityState={{ disabled: pending }}
                        disabled={pending}
                        onPress={() => setConfirmTarget(item)}
                        style={({ pressed }) => [
                          styles.action,
                          {
                            backgroundColor: pending
                              ? theme.colors.neutralSoft
                              : asisten
                                ? theme.colors.errorSoft
                                : theme.colors.primarySoft,
                          },
                          pressed && !pending && styles.pressed,
                        ]}
                      >
                        <AssistantText
                          style={[
                            styles.actionText,
                            {
                              color: pending
                                ? theme.colors.textSecondary
                                : asisten
                                  ? theme.colors.error
                                  : theme.colors.primary,
                            },
                          ]}
                        >
                          {asisten ? 'Jadikan Praktikan' : 'Jadikan Asisten'}
                        </AssistantText>
                      </Pressable>
                    ) : null}
                  </View>
                );
              }}
            />
          </View>
        </AssistantSurface>
      </View>

      {confirmTarget ? (
        <AdminRoleConfirmation
          target={confirmTarget}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={() => {
            const target = confirmTarget;
            setConfirmTarget(null);
            if (target) void changeRole(target);
          }}
        />
      ) : null}
    </>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1 },
  frame: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  listFlex: { flex: 1 },
  list: {
    flexGrow: 1,
    paddingHorizontal: tokens.spacing.page,
    paddingTop: 14,
    paddingBottom: tokens.spacing.page,
    gap: 14,
  },
  headerBlock: { gap: 14 },
  eyebrow: {
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.6,
    fontFamily: tokens.fonts.semibold,
    color: theme.colors.heroSoft,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 35,
    letterSpacing: -0.8,
    color: theme.colors.onHero,
  },
  metrics: {
    marginTop: 2,
    paddingTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: theme.colors.heroLine,
  },
  metric: { flex: 1, minWidth: 60, gap: 5, paddingHorizontal: 8, paddingVertical: 4 },
  metricDivider: {
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: theme.colors.heroLine,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: tokens.fonts.bold,
    color: theme.colors.onHero,
    letterSpacing: -0.7,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: { fontSize: 10, lineHeight: 16, color: theme.colors.heroSoft },
  controls: { gap: 10 },
  search: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: tokens.radius.control,
    color: theme.colors.textPrimary,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: theme.colors.glassMuted,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: tokens.radius.pill,
  },
  filterActive: {
    backgroundColor: theme.colors.primaryFill,
    borderColor: theme.colors.primaryFill,
  },
  filterLabel: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: tokens.fonts.semibold,
    color: theme.colors.textSecondary,
  },
  filterLabelActive: { color: theme.colors.onPrimary },
  filterCount: {
    fontSize: 10,
    lineHeight: 16,
    fontFamily: tokens.fonts.semibold,
    color: theme.colors.textSecondary,
  },
  filterCountActive: { color: theme.colors.onPrimarySoft },
  actionError: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: tokens.fonts.medium,
    color: theme.colors.error,
  },
  card: {
    gap: 16,
    padding: 18,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: tokens.radius.card,
    boxShadow: theme.colors.shadow,
  },
  cardInfo: { gap: 5 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: tokens.fonts.bold,
    letterSpacing: -0.2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: tokens.fonts.semibold,
  },
  meta: { fontSize: 11, lineHeight: 16 },
  action: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: tokens.radius.button,
  },
  actionText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: tokens.fonts.semibold,
  },
  state: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 56,
  },
  stateTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: tokens.fonts.bold,
    textAlign: 'center',
  },
  center: { textAlign: 'center' },
  retry: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: theme.colors.primaryFill,
    borderRadius: tokens.radius.control,
  },
  white: { color: theme.colors.onPrimary },
  empty: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.panel,
    backgroundColor: theme.colors.glassMuted,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontFamily: tokens.fonts.bold,
    textAlign: 'center',
  },
  pressed: { opacity: 0.75 },
});
