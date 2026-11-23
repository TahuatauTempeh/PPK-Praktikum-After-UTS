/**
 * Kesan pesan satu sesi untuk asisten: info sesi, lalu tiap isian praktikan beserta label AI.
 * Header mengikuti halaman Tinjau izin dan Kelola sesi.
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { pantauKesanPesanSesi, type KesanPesan } from '@/lib/kesan-pesan-service';
import { formatWaktuIzin, namaSesi } from '@/screens/shared/izin';
import { KETERANGAN_SENTIMEN } from '@/screens/shared/sentimen';
import { tokens, useThemedStyles, useTheme, type Theme } from '@/theme';

import { AssistantScreen } from '../components/assistant-screen';
import { AssistantText } from '../components/assistant-text';
import { ScheduleIcon } from '../components/schedule-icon';
import { useSesiIzin } from '../izin/use-sesi-izin';
import { formatSessionDate } from '../session-format';
import { LabelAi } from './label-ai';

type Props = { sessionId: string; onBack: () => void };

export default function KesanPesanPerSesi({ sessionId, onBack }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const { sessions, keadaan: keadaanSesi } = useSesiIzin();
  const [daftar, setDaftar] = useState<KesanPesan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(
    () =>
      pantauKesanPesanSesi(
        sessionId,
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
    [sessionId, retryKey]
  );

  const session = sessions.find((item) => item.id === sessionId);

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <ScheduleIcon name="backPrimary" size={20} tintColor={theme.colors.onHero} />
      </Pressable>
      <AssistantText style={styles.headerTitle} accessibilityRole="header">
        Kesan pesan sesi
      </AssistantText>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <AssistantScreen edges={['top', 'left', 'right', 'bottom']}>
      {header}

      <View style={styles.card}>
        <AssistantText variant="cardTitle" accessibilityRole="header">
          {namaSesi(session, keadaanSesi)}
        </AssistantText>
        {session ? (
          <View style={styles.metaItem}>
            <ScheduleIcon name="calendarSmall" size={15} tintColor={theme.colors.iconMuted} />
            <AssistantText variant="caption" tone="secondary" style={styles.flex}>
              {formatSessionDate(session.date)} · {session.time.replace(/:/g, '.')} · {session.room}
            </AssistantText>
          </View>
        ) : null}
        {!loading && !error ? <AssistantText variant="label">{daftar.length} kesan pesan</AssistantText> : null}
      </View>

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
      ) : daftar.length === 0 ? (
        <View style={styles.state}>
          <AssistantText style={styles.stateTitle}>Belum ada kesan pesan</AssistantText>
          <AssistantText tone="secondary" style={styles.center}>
            Belum ada praktikan yang mengisi kesan pesan untuk sesi ini.
          </AssistantText>
        </View>
      ) : (
        <View style={styles.section}>
          <AssistantText variant="sectionTitle" accessibilityRole="header">
            Kesan pesan praktikan
          </AssistantText>
          <AssistantText variant="caption" tone="secondary">
            {KETERANGAN_SENTIMEN}
          </AssistantText>
          <View style={styles.list} accessibilityLiveRegion="polite">
            {daftar.map((item) => (
              <View key={item.id} style={styles.isian}>
                <View style={styles.isianInfo}>
                  <AssistantText style={styles.name}>{item.userName || 'Praktikan'}</AssistantText>
                  <AssistantText variant="caption" tone="secondary" style={styles.meta}>
                    {formatWaktuIzin(item.createdAt)}
                  </AssistantText>
                </View>
                <AssistantText>{item.text}</AssistantText>
                <View style={styles.aiRow}>
                  <AssistantText variant="caption" tone="secondary">
                    Analisis AI
                  </AssistantText>
                  <LabelAi label={item.aiLabel} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </AssistantScreen>
  );
}

const gaya = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
    // Area sentuh 44 px; panah putih duduk langsung di gradien, sama dengan layar sesi.
    back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      lineHeight: 24,
      fontFamily: tokens.fonts.bold,
      color: theme.colors.onHero,
    },
    headerSpacer: { width: 44 },
    card: {
      gap: 10,
      padding: 20,
      backgroundColor: theme.colors.glassSurface,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      borderRadius: tokens.radius.card,
      boxShadow: theme.colors.shadow,
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    section: { gap: 10 },
    list: { gap: 12 },
    isian: {
      gap: 12,
      padding: 18,
      backgroundColor: theme.colors.glassSurface,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      borderRadius: tokens.radius.card,
      boxShadow: theme.colors.shadow,
    },
    isianInfo: { gap: 2 },
    name: { fontSize: 15, lineHeight: 20, fontFamily: tokens.fonts.bold, letterSpacing: -0.2 },
    meta: { fontSize: 11, lineHeight: 16 },
    aiRow: { gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.hairline },
    state: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 48 },
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
    pressed: { opacity: 0.75 },
  });
