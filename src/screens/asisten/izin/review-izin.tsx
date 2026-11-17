/**
 * Tinjau izin (task 4.7): alasan, hasil AI, catatan, lalu terima atau tolak.
 * Keputusan disimpan bersama reviewedBy, reviewedAt, dan audit log lewat permission-service.
 * Header dan footer mengikuti halaman Kelola sesi.
 */

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { pantauIzin, pesanGalatIzin, tinjauIzin, type PermissionRequest } from '@/lib/permission-service';
import { AI_TIDAK_TERSEDIA, KETERANGAN_AI, formatWaktuIzin, namaSesi, ringkasAi } from '@/screens/shared/izin';
import { tokens, useThemedStyles, useTheme, type Theme } from '@/theme';

import { AssistantScreen } from '../components/assistant-screen';
import { AssistantText } from '../components/assistant-text';
import { ScheduleIcon } from '../components/schedule-icon';
import { formatSessionDate } from '../session-format';
import { StatusBadge } from './daftar-izin';
import { ReviewConfirmation } from './review-confirmation';
import { useSesiIzin } from './use-sesi-izin';

const NOTE_MAX = 300;

type Props = { id: string; onBack: () => void };

export default function ReviewIzin({ id, onBack }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const { profile } = useAuth();
  const { sessions, keadaan: keadaanSesi } = useSesiIzin();
  const [request, setRequest] = useState<PermissionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [note, setNote] = useState('');
  const [confirmation, setConfirmation] = useState<'approved' | 'rejected' | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const savingRef = useRef(false);

  useEffect(
    () =>
      pantauIzin(
        id,
        (item) => {
          setRequest(item);
          setError(null);
          setLoading(false);
        },
        (pesan) => {
          setError(pesan);
          setLoading(false);
        }
      ),
    [id, retryKey]
  );

  const header = (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <ScheduleIcon name="backPrimary" size={20} tintColor={theme.colors.onHero} />
      </Pressable>
      <AssistantText style={styles.headerTitle} accessibilityRole="header">Tinjau izin</AssistantText>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading || error || !request) {
    return (
      <AssistantScreen edges={['top', 'left', 'right', 'bottom']}>
        {header}
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.colors.primary} />
            <AssistantText tone="secondary">Memuat izin...</AssistantText>
          </View>
        ) : (
          <View style={styles.empty} accessibilityRole={error ? 'alert' : undefined}>
            <AssistantText style={styles.emptyTitle}>{error ? 'Gagal memuat izin' : 'Izin tidak ditemukan'}</AssistantText>
            <AssistantText tone="secondary" style={styles.center}>
              {error ?? 'Izin ini tidak tersedia. Kembali ke daftar untuk memilih izin lain.'}
            </AssistantText>
            <Pressable accessibilityRole="button"
              onPress={error ? () => { setLoading(true); setError(null); setRetryKey(value => value + 1); } : onBack}
              style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}>
              <AssistantText variant="label" style={styles.white}>{error ? 'Coba lagi' : 'Kembali ke daftar izin'}</AssistantText>
            </Pressable>
          </View>
        )}
      </AssistantScreen>
    );
  }

  const session = sessions.find(item => item.id === request.sessionId);
  const sessionName = namaSesi(session, keadaanSesi);
  const pending = request.status === 'pending';
  const ai = ringkasAi(request);
  const reviewer = request.reviewedBy && request.reviewedBy === profile?.id ? 'kamu' : 'asisten';

  async function save(decision: 'approved' | 'rejected') {
    if (savingRef.current || !profile || !request) return;
    savingRef.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      await tinjauIzin({ id: request.id, keputusan: decision, catatan: note, reviewerId: profile.id });
      setFeedback({ tone: 'success', text: decision === 'approved' ? 'Izin diterima.' : 'Izin ditolak.' });
    } catch (saveError) {
      setFeedback({ tone: 'error', text: pesanGalatIzin(saveError) });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  // tombol nonaktif tidak memakai opacity rendah (DESIGN.md 8.4), tetapi latar netral dan teks sekunder
  const footer = pending ? (
    <View style={styles.footer}>
      <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving }}
        accessibilityLabel={`Tolak izin ${request.userName}`}
        onPress={() => setConfirmation('rejected')}
        style={({ pressed }) => [styles.button, styles.flex, saving ? styles.disabled : styles.danger, pressed && styles.pressed]}>
        <AssistantText variant="label" style={saving ? styles.disabledText : styles.onError}>Tolak</AssistantText>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving }}
        accessibilityLabel={`Terima izin ${request.userName}`}
        onPress={() => setConfirmation('approved')}
        style={({ pressed }) => [styles.button, styles.flex, saving ? styles.disabled : styles.primary, pressed && styles.pressed]}>
        <AssistantText variant="label" style={saving ? styles.disabledText : styles.white}>
          {saving ? 'Menyimpan...' : 'Terima'}
        </AssistantText>
      </Pressable>
    </View>
  ) : undefined;

  return (
    <>
      <View style={styles.screen} aria-hidden={confirmation !== null}
        importantForAccessibility={confirmation ? 'no-hide-descendants' : 'auto'}>
        <AssistantScreen footer={footer} edges={pending ? ['top', 'left', 'right'] : ['top', 'left', 'right', 'bottom']}>
          {header}

          <View style={styles.card}>
            <View style={styles.nameRow}>
              <AssistantText variant="cardTitle" accessibilityRole="header" style={styles.flex}>
                {request.userName || 'Praktikan'}
              </AssistantText>
              <StatusBadge status={request.status} />
            </View>
            <View style={styles.metaGroup}>
              <AssistantText variant="label">{sessionName}</AssistantText>
              {session ? (
                <View style={styles.metaItem}>
                  <ScheduleIcon name="calendarSmall" size={15} tintColor={theme.colors.iconMuted} />
                  <AssistantText variant="caption" tone="secondary" style={styles.flex}>
                    {formatSessionDate(session.date)} · {session.time.replace(/:/g, '.')} · {session.room}
                  </AssistantText>
                </View>
              ) : null}
              <AssistantText variant="caption" tone="secondary">Diajukan {formatWaktuIzin(request.createdAt)}</AssistantText>
            </View>
          </View>

          <View style={styles.section}>
            <AssistantText variant="sectionTitle" accessibilityRole="header">Alasan</AssistantText>
            <View style={styles.panel}>
              <AssistantText>{request.reason}</AssistantText>
            </View>
          </View>

          <View style={styles.section}>
            <AssistantText variant="sectionTitle" accessibilityRole="header">Analisis AI</AssistantText>
            <View style={styles.panel}>
              <AssistantText variant="label">{ai ?? AI_TIDAK_TERSEDIA}</AssistantText>
              <AssistantText variant="caption" tone="secondary">
                {ai ? KETERANGAN_AI : 'Model tidak mengenali kata dalam alasan ini, jadi tinjau alasannya langsung.'}
              </AssistantText>
            </View>
          </View>

          <View style={styles.section}>
            <AssistantText variant="sectionTitle" accessibilityRole="header">Catatan</AssistantText>
            {pending ? (
              <>
                <TextInput
                  accessibilityLabel="Catatan untuk praktikan"
                  value={note}
                  onChangeText={setNote}
                  placeholder="Opsional, misalnya alasan penolakan"
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  maxLength={NOTE_MAX}
                  textAlignVertical="top"
                  editable={!saving}
                  style={styles.input}
                />
                <AssistantText variant="caption" tone="secondary" style={styles.counter}>
                  {note.length}/{NOTE_MAX}
                </AssistantText>
              </>
            ) : (
              <View style={styles.panel}>
                <AssistantText>{request.reviewNote ?? 'Tanpa catatan.'}</AssistantText>
                <AssistantText variant="caption" tone="secondary">
                  Ditinjau oleh {reviewer}, {formatWaktuIzin(request.reviewedAt)}
                </AssistantText>
              </View>
            )}
          </View>

          {feedback ? (
            <AssistantText variant="caption" accessibilityRole={feedback.tone === 'error' ? 'alert' : undefined}
              accessibilityLiveRegion="polite"
              style={feedback.tone === 'error' ? styles.errorText : styles.successText}>
              {feedback.text}
            </AssistantText>
          ) : null}
        </AssistantScreen>
      </View>

      {confirmation ? (
        <ReviewConfirmation
          decision={confirmation}
          name={request.userName || 'Praktikan'}
          sessionName={sessionName}
          note={note}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            const decision = confirmation;
            setConfirmation(null);
            void save(decision);
          }}
        />
      ) : null}
    </>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  // Area sentuh 44 px; panah putih duduk langsung di gradien, sama dengan layar sesi.
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 24, fontFamily: tokens.fonts.bold, color: theme.colors.onHero },
  headerSpacer: { width: 44 },
  card: {
    gap: 14,
    padding: 20,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: tokens.radius.card,
    boxShadow: theme.colors.shadow,
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  metaGroup: { gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  section: { gap: 10 },
  panel: {
    gap: 6,
    padding: 16,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: tokens.radius.block,
  },
  input: {
    minHeight: 104,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    // kolom hanya dikenali dari garisnya, jadi memakai garis tegas DESIGN.md 4.2
    borderColor: theme.scheme === 'dark' ? '#6B7280' : '#7488A8',
    borderRadius: tokens.radius.control,
    color: theme.colors.textPrimary,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  counter: { textAlign: 'right' },
  errorText: { color: theme.colors.error },
  successText: { color: theme.colors.success },
  state: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 56 },
  empty: { paddingHorizontal: 22, paddingVertical: 46, gap: 16, alignItems: 'center', backgroundColor: theme.colors.glassSurface, borderWidth: 1, borderColor: theme.colors.glassBorder, borderRadius: tokens.radius.card },
  emptyTitle: { fontFamily: tokens.fonts.bold, fontSize: 20, lineHeight: 27, textAlign: 'center' },
  center: { textAlign: 'center' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, paddingVertical: 16, backgroundColor: theme.colors.background, width: '100%', maxWidth: tokens.contentWidth, alignSelf: 'center' },
  button: { minHeight: 50, borderWidth: 1, borderRadius: tokens.radius.control, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primary: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
  danger: { backgroundColor: theme.colors.errorFill, borderColor: theme.colors.errorFill },
  white: { color: theme.colors.onPrimary },
  onError: { color: theme.colors.onError },
  pressed: { opacity: 0.7 },
  disabled: { backgroundColor: theme.colors.neutralSoft, borderColor: theme.colors.neutralSoft },
  disabledText: { color: theme.colors.textSecondary },
});
