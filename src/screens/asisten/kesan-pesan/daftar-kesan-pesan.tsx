/**
 * Daftar kesan pesan untuk asisten: isian praktikan dikelompokkan per sesi, realtime.
 * Label AI dibaca per isian di halaman sesi. Tampilan mengikuti daftar izin.
 */

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { pantauSemuaKesanPesan, type KesanPesan } from '@/lib/kesan-pesan-service';
import { HeroCard } from '@/screens/shared/components/hero-card';
import { namaSesi } from '@/screens/shared/izin';
import { tokens, useThemedStyles, useTheme, type Theme } from '@/theme';

import { AssistantScreen } from '../components/assistant-screen';
import { AssistantText } from '../components/assistant-text';
import { AssistantTopBar } from '../components/assistant-top-bar';
import { ScheduleIcon } from '../components/schedule-icon';
import { useSesiIzin } from '../izin/use-sesi-izin';
import { formatSessionDate } from '../session-format';

type Props = { onBack: () => void; onOpen: (sessionId: string) => void };

type Kelompok = { sessionId: string; isian: KesanPesan[] };

export default function DaftarKesanPesan({ onBack, onOpen }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const { sessions, keadaan: keadaanSesi } = useSesiIzin();
  const [daftar, setDaftar] = useState<KesanPesan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(
    () =>
      pantauSemuaKesanPesan(
        (hasil) => {
          setDaftar(hasil);
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

  // Isian sudah urut terbaru, jadi urutan kelompok mengikuti isian terbaru tiap sesi.
  const kelompok = useMemo(() => {
    const peta = new Map<string, KesanPesan[]>();
    for (const item of daftar) {
      const isian = peta.get(item.sessionId);
      if (isian) isian.push(item);
      else peta.set(item.sessionId, [item]);
    }
    return Array.from(peta, ([sessionId, isian]): Kelompok => ({ sessionId, isian }));
  }, [daftar]);

  const unavailable = loading || error !== null;
  const metrics = [
    { label: 'Sesi', value: unavailable ? '-' : kelompok.length },
    { label: 'Kesan pesan', value: unavailable ? '-' : daftar.length },
  ];

  return (
    <AssistantScreen header={<AssistantTopBar onBack={onBack} title="Kesan Pesan" />} edges={['top', 'left', 'right', 'bottom']}>
      <HeroCard
        backgroundColor={theme.colors.glassHero}
        watermark={<ScheduleIcon name="formCheck" size={126} tintColor={theme.colors.onHero} />}
        padding={20}
        gap={12}
      >
        <AssistantText style={styles.eyebrow}>KESAN PESAN SESI</AssistantText>
        <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.heroTitle}>
          Kesan pesan praktikan
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

      <View style={styles.list} accessibilityLiveRegion="polite">
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.colors.primary} />
            <AssistantText tone="secondary">Memuat kesan pesan...</AssistantText>
          </View>
        ) : error ? (
          <View style={styles.state} accessibilityRole="alert">
            <AssistantText style={styles.stateTitle}>Gagal memuat kesan pesan</AssistantText>
            <AssistantText tone="secondary" style={styles.center}>
              {error}
            </AssistantText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Coba lagi memuat kesan pesan"
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
        ) : kelompok.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <ScheduleIcon name="formCheck" size={34} tintColor={theme.colors.primary} />
            </View>
            <AssistantText style={styles.emptyTitle} accessibilityRole="header">
              Belum ada kesan pesan
            </AssistantText>
            <AssistantText tone="secondary" style={styles.center}>
              Kesan pesan muncul setelah praktikan yang hadir mengisinya untuk sesi yang sudah ditutup.
            </AssistantText>
          </View>
        ) : (
          kelompok.map((item) => {
            const session = sessions.find((s) => s.id === item.sessionId);
            const nama = namaSesi(session, keadaanSesi);
            return (
              <View key={item.sessionId} style={styles.card}>
                <View style={styles.cardInfo}>
                  <AssistantText style={styles.name}>{nama}</AssistantText>
                  <AssistantText variant="caption" tone="secondary" style={styles.meta}>
                    {session ? `${formatSessionDate(session.date)} · ` : ''}
                    {item.isian.length} kesan pesan
                  </AssistantText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Lihat kesan pesan ${nama}`}
                  onPress={() => onOpen(item.sessionId)}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                >
                  <AssistantText style={styles.actionText} tone="accent">
                    Lihat kesan pesan
                  </AssistantText>
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </AssistantScreen>
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
    name: { fontSize: 15, lineHeight: 20, fontFamily: tokens.fonts.bold, letterSpacing: -0.2 },
    meta: { fontSize: 11, lineHeight: 16 },
    action: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: tokens.radius.button,
      backgroundColor: theme.colors.primarySoft,
    },
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
