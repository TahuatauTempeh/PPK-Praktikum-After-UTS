/**
 * Daftar izin untuk asisten (task 4.6): realtime, filter status, alasan, dan hasil AI.
 * Tampilan mengikuti halaman admin: HeroCard dengan metrik, chip filter pil, dan kartu kaca.
 */

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { pantauSemuaIzin, type PermissionRequest, type PermissionStatus } from '@/lib/permission-service';
import { HeroCard } from '@/screens/shared/components/hero-card';
import { STATUS_IZIN, formatWaktuIzin, namaSesi } from '@/screens/shared/izin';
import { tokens, useThemedStyles, useTheme, type Theme } from '@/theme';

import { AssistantScreen } from '../components/assistant-screen';
import { AssistantText } from '../components/assistant-text';
import { AssistantTopBar } from '../components/assistant-top-bar';
import { ScheduleIcon } from '../components/schedule-icon';

import { useSesiIzin } from './use-sesi-izin';

type Filter = PermissionStatus | 'all';

const filters: readonly { value: Filter; label: string }[] = [
  { value: 'pending', label: STATUS_IZIN.pending },
  { value: 'approved', label: STATUS_IZIN.approved },
  { value: 'rejected', label: STATUS_IZIN.rejected },
  { value: 'all', label: 'Semua' },
];

const emptyText: Record<Filter, string> = {
  pending: 'Tidak ada izin yang menunggu tinjauan.',
  approved: 'Belum ada izin yang diterima.',
  rejected: 'Belum ada izin yang ditolak.',
  all: 'Izin dari praktikan akan muncul di sini.',
};

type Props = { onBack: () => void; onOpen: (id: string) => void };

export default function DaftarIzin({ onBack, onOpen }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const { sessions, keadaan: keadaanSesi } = useSesiIzin();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [filter, setFilter] = useState<Filter>('pending');

  useEffect(
    () =>
      pantauSemuaIzin(
        (daftar) => {
          setRequests(daftar);
          setError(null);
          setLoading(false);
        },
        (pesan) => {
          setError(pesan);
          setLoading(false);
        }
      ),
    [retryKey]
  );

  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((item) => item.status === 'pending').length,
      approved: requests.filter((item) => item.status === 'approved').length,
      rejected: requests.filter((item) => item.status === 'rejected').length,
    }),
    [requests]
  );

  const visible = filter === 'all' ? requests : requests.filter((item) => item.status === filter);
  const unavailable = loading || error !== null;
  const metrics: { label: string; value: string | number }[] = [
    { label: STATUS_IZIN.pending, value: unavailable ? '-' : counts.pending },
    { label: STATUS_IZIN.approved, value: unavailable ? '-' : counts.approved },
    { label: STATUS_IZIN.rejected, value: unavailable ? '-' : counts.rejected },
  ];

  return (
    <AssistantScreen header={<AssistantTopBar onBack={onBack} title="Izin" />} edges={['top', 'left', 'right', 'bottom']}>
      <HeroCard
        backgroundColor={theme.colors.glassHero}
        watermark={<ScheduleIcon name="info" size={126} tintColor={theme.colors.onHero} />}
        padding={20}
        gap={12}
      >
        <AssistantText style={styles.eyebrow}>PENGAJUAN IZIN</AssistantText>
        <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.heroTitle}>
          Izin praktikan
        </AssistantText>
        <View style={styles.metrics} accessibilityLiveRegion="polite">
          {metrics.map((metric, index) => (
            <View key={metric.label} style={[styles.metric, index < metrics.length - 1 && styles.metricDivider]}>
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

      <View style={styles.filters} accessibilityLabel="Filter status izin">
        {filters.map(({ value, label }) => {
          const active = filter === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${counts[value]} izin`}
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(value)}
              style={({ pressed }) => [styles.filter, active && styles.filterActive, pressed && styles.pressed]}
            >
              <AssistantText style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</AssistantText>
              <AssistantText style={[styles.filterCount, active && styles.filterCountActive]}>
                {counts[value]}
              </AssistantText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list} accessibilityLiveRegion="polite">
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.colors.primary} />
            <AssistantText tone="secondary">Memuat izin...</AssistantText>
          </View>
        ) : error ? (
          <View style={styles.state} accessibilityRole="alert">
            <AssistantText style={styles.stateTitle}>Gagal memuat izin</AssistantText>
            <AssistantText tone="secondary" style={styles.center}>
              {error}
            </AssistantText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Coba lagi memuat izin"
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
        ) : visible.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <ScheduleIcon name="info" size={34} tintColor={theme.colors.primary} />
            </View>
            <AssistantText style={styles.emptyTitle} accessibilityRole="header">
              Tidak ada izin
            </AssistantText>
            <AssistantText tone="secondary" style={styles.center}>
              {emptyText[filter]}
            </AssistantText>
          </View>
        ) : (
          visible.map((item) => (
            <IzinCard
              key={item.id}
              item={item}
              sessionName={namaSesi(sessions.find((session) => session.id === item.sessionId), keadaanSesi)}
              onOpen={() => onOpen(item.id)}
            />
          ))
        )}
      </View>
    </AssistantScreen>
  );
}

function IzinCard({ item, sessionName, onOpen }: { item: PermissionRequest; sessionName: string; onOpen: () => void }) {
  const styles = useThemedStyles(gaya);
  const pending = item.status === 'pending';

  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <AssistantText style={styles.name}>{item.userName || 'Praktikan'}</AssistantText>
          <StatusBadge status={item.status} />
        </View>
        <AssistantText variant="caption" tone="secondary" style={styles.meta}>
          {sessionName} · {formatWaktuIzin(item.createdAt)}
        </AssistantText>
      </View>

      <AssistantText numberOfLines={3}>{item.reason}</AssistantText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${pending ? 'Tinjau' : 'Lihat'} izin ${item.userName}, ${sessionName}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.action, pending ? styles.actionPrimary : styles.actionSoft, pressed && styles.pressed]}
      >
        <AssistantText style={[styles.actionText, pending && styles.white]} tone="accent">
          {pending ? 'Tinjau izin' : 'Lihat detail'}
        </AssistantText>
      </Pressable>
    </View>
  );
}

export function StatusBadge({ status }: { status: PermissionStatus }) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const color = {
    pending: { background: theme.colors.neutralSoft, text: theme.colors.textSecondary },
    approved: { background: theme.colors.successSoft, text: theme.colors.success },
    rejected: { background: theme.colors.errorSoft, text: theme.colors.error },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: color.background }]}>
      <View style={[styles.dot, { backgroundColor: color.text }]} />
      <AssistantText style={[styles.badgeText, { color: color.text }]}>{STATUS_IZIN[status]}</AssistantText>
    </View>
  );
}

const gaya = (theme: Theme) =>
  StyleSheet.create({
    eyebrow: {
      fontSize: 10,
      lineHeight: 16,
      letterSpacing: 1.6,
      fontFamily: tokens.fonts.semibold,
      color: theme.colors.heroSoft,
    },
    heroTitle: { fontSize: 28, lineHeight: 35, letterSpacing: -0.8, color: theme.colors.onHero },
    metrics: {
      marginTop: 2,
      paddingTop: 14,
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderTopWidth: 1,
      borderTopColor: theme.colors.heroLine,
    },
    metric: { flex: 1, minWidth: 60, gap: 5, paddingHorizontal: 8, paddingVertical: 4 },
    metricDivider: { marginRight: 8, borderRightWidth: 1, borderRightColor: theme.colors.heroLine },
    metricValue: {
      fontSize: 20,
      lineHeight: 28,
      fontFamily: tokens.fonts.bold,
      color: theme.colors.onHero,
      letterSpacing: -0.7,
      fontVariant: ['tabular-nums'],
    },
    metricLabel: { fontSize: 10, lineHeight: 16, color: theme.colors.heroSoft },
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
    filterActive: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
    filterLabel: { fontSize: 12, lineHeight: 18, fontFamily: tokens.fonts.semibold, color: theme.colors.textSecondary },
    filterLabelActive: { color: theme.colors.onPrimary },
    filterCount: { fontSize: 10, lineHeight: 16, fontFamily: tokens.fonts.semibold, color: theme.colors.textSecondary },
    filterCountActive: { color: theme.colors.onPrimarySoft },
    list: { gap: 14 },
    card: {
      gap: 16,
      padding: 18,
      backgroundColor: theme.colors.glassSurface,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      borderRadius: tokens.radius.card,
      boxShadow: theme.colors.shadow,
    },
    cardInfo: { gap: 4 },
    nameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
    name: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 20, fontFamily: tokens.fonts.bold, letterSpacing: -0.2 },
    meta: { fontSize: 11, lineHeight: 16 },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: tokens.radius.pill,
      flexShrink: 0,
    },
    dot: { width: 5, height: 5, borderRadius: 3 },
    badgeText: { fontSize: 10, lineHeight: 15, fontFamily: tokens.fonts.semibold },
    action: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: tokens.radius.button,
    },
    actionPrimary: { backgroundColor: theme.colors.primaryFill },
    actionSoft: { backgroundColor: theme.colors.primarySoft },
    actionText: { fontSize: 12, lineHeight: 18, fontFamily: tokens.fonts.semibold },
    state: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 56 },
    stateTitle: { fontSize: 18, lineHeight: 24, fontFamily: tokens.fonts.bold, textAlign: 'center' },
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
    empty: { alignItems: 'center', gap: 16, paddingHorizontal: 22, paddingVertical: 32 },
    emptyIcon: {
      width: 84,
      height: 84,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.radius.panel,
      backgroundColor: theme.colors.glassMuted,
    },
    emptyTitle: { fontSize: 20, lineHeight: 27, fontFamily: tokens.fonts.bold, textAlign: 'center' },
    pressed: { opacity: 0.75 },
  });
