import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/ErrorState';
import { listenAllEnrollments } from '@/lib/enrollment-service';
import { useSessionManage } from '@/lib/useSessionFirestore';
import type { Enrollment } from '@/types';
import {
  fonts,
  tokens,
  useThemedStyles,
  useTheme,
  type Theme,
} from '@/theme';
import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { ScheduleIcon } from './components/schedule-icon';
import { SessionCardSurface, summaryDock } from './components/session-card-surface';
import { SessionConfirmation } from './components/session-confirmation';
import { formatAttendanceTime, formatSessionDate } from './session-format';
import { summarizeAttendance } from './session-summary';

type Props = { firestoreId: string; onBack: () => void; onRecap?: (id: string) => void };

export default function SessionScreen({ firestoreId, onBack, onRecap }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const {
    session: fsSession,
    loading,
    attendanceRecords,
    openSession: fsOpen,
    closeSession: fsClose,
  } = useSessionManage(firestoreId);

  const [confirmation, setConfirmation] = useState<'open' | 'close' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => listenAllEnrollments(setEnrollments), []);

  const handleConfirm = useCallback(async () => {
    setActionLoading(true);
    if (confirmation === 'open') {
      const result = await fsOpen();
      setFeedback(result.message);
    } else if (confirmation === 'close') {
      const result = await fsClose();
      setFeedback(result.message);
    }
    setConfirmation(null);
    setActionLoading(false);
  }, [confirmation, fsOpen, fsClose]);

  const header = (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <ScheduleIcon name="backPrimary" size={20} tintColor={theme.colors.onHero} />
      </Pressable>
      <AssistantText style={styles.headerTitle} accessibilityRole="header">Kelola sesi</AssistantText>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading) return (
    <AssistantScreen>{header}<ActivityIndicator style={{ marginTop: 32 }} /></AssistantScreen>
  );

  if (!fsSession) {
    return <ErrorState title="Sesi tidak ditemukan" message="Sesi mungkin sudah dihapus." />;
  }

  const scheduled = fsSession.status === 'scheduled';
  const open = fsSession.status === 'open';
  const closed = fsSession.status === 'closed';
  const summary = summarizeAttendance(attendanceRecords, enrollments, fsSession.classId);
  const present = summary.present;
  const total = summary.total;
  const percent = summary.percent;
  const actionDisabled = (closed && !onRecap) || actionLoading;

  // Buat objek session-like untuk SessionConfirmation.
  const sessionForConfirm = {
    id: fsSession.id,
    code: '',
    course: fsSession.title,
    topic: fsSession.title,
    className: '',
    date: fsSession.date,
    startTime: fsSession.startTime,
    endTime: fsSession.endTime,
    room: fsSession.room,
    status: (scheduled ? 'pending' : fsSession.status) as 'pending' | 'open' | 'closed',
    participantIds: [] as readonly string[],
  };

  return (
    <>
      <View style={styles.screen} aria-hidden={confirmation !== null}
        importantForAccessibility={confirmation ? 'no-hide-descendants' : 'auto'}>
        <AssistantScreen footer={
          <View style={styles.footer}>
            <Pressable
              testID={scheduled ? 'sesi-buka' : open ? 'sesi-tutup' : undefined}
              accessibilityRole="button"
              disabled={actionDisabled}
              accessibilityState={{ disabled: actionDisabled }}
              onPress={() => {
                if (closed) onRecap?.(firestoreId);
                else setConfirmation(scheduled ? 'open' : 'close');
              }}
              style={({ pressed }) => [styles.button, open ? styles.secondary : styles.primary, actionDisabled && styles.disabled, pressed && styles.pressed]}>
              <ScheduleIcon name={scheduled ? 'doorOpenWhite' : open ? 'lock' : 'chartWhite'} size={18}
                tintColor={open ? theme.colors.primary : undefined} />
              <AssistantText variant="label" tone="accent" style={!open && styles.white}>
                {scheduled ? 'Buka sesi' : open ? 'Tutup sesi' : 'Lihat rekap sesi'}
              </AssistantText>
            </Pressable>
          </View>
        }>
          {header}
          <SessionCardSurface>
            <View style={styles.identity}>
              <View style={styles.topRow}>
                <View style={[styles.badge, open && styles.activeBadge]}>
                  <ScheduleIcon name={open ? 'dotOpen' : 'dotNeutral'} size={5}
                    tintColor={open ? theme.colors.primary : theme.colors.iconMuted} />
                  <AssistantText style={[styles.badgeText, open && styles.activeBadgeText]} tone={open ? 'accent' : 'secondary'}>
                    {fsSession.status === 'scheduled' ? 'Belum dibuka' : fsSession.status === 'open' ? 'Dibuka' : 'Ditutup'}
                  </AssistantText>
                </View>
              </View>
              <View style={styles.material}>
                <AssistantText variant="detailTitle" accessibilityRole="header">{fsSession.title}</AssistantText>
              </View>
              <View style={styles.metadata}>
                <View style={styles.metaItem}>
                  <ScheduleIcon name="calendarSmall" size={15} tintColor={theme.colors.iconMuted} />
                  <AssistantText variant="caption" tone="secondary">{formatSessionDate(fsSession.date)}</AssistantText>
                </View>
                <View style={[styles.metaItem, styles.timeMetaItem]}>
                  <ScheduleIcon name="clock" size={15} tintColor={theme.colors.iconMuted} />
                  <AssistantText variant="caption" tone="secondary">{fsSession.startTime.replace(':', '.')}–{fsSession.endTime.replace(':', '.')}</AssistantText>
                </View>
              </View>
              <View style={styles.metaItem}>
                <ScheduleIcon name="pin" size={15} tintColor={theme.colors.iconMuted} />
                <AssistantText variant="caption" tone="secondary" style={styles.shrink}>{fsSession.room}</AssistantText>
              </View>
            </View>
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <View style={styles.total}>
                  <AssistantText style={styles.count}>{present}</AssistantText>
                  <AssistantText style={styles.summaryText}>hadir</AssistantText>
                </View>
                <AssistantText style={styles.summaryPercent}>{percent === null ? '—' : `${percent}%`}</AssistantText>
              </View>
              <View style={styles.progress} accessibilityRole="progressbar">
                <View style={[styles.progressFill, { width: `${percent ?? 0}%` }]} />
              </View>
            </View>
          </SessionCardSurface>
          {feedback !== '' && <AssistantText variant="caption" tone="accent" accessibilityLiveRegion="polite">{feedback}</AssistantText>}
          <View style={styles.attendance} accessibilityLiveRegion="polite">
            <View style={styles.listHeading}>
              <AssistantText variant="sectionTitle" accessibilityRole="header">{closed ? 'Hasil presensi' : 'Presensi praktikan'}</AssistantText>
              <AssistantText variant="caption" tone="secondary">{present} hadir</AssistantText>
            </View>
            {present === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}><ScheduleIcon name={scheduled ? 'doorClosed' : 'users'} size={34} tintColor={theme.colors.primary} /></View>
                <AssistantText style={styles.emptyTitle} accessibilityRole="header">{scheduled ? 'Sesi belum dibuka' : 'Menunggu praktikan'}</AssistantText>
                <AssistantText tone="secondary" style={styles.center}>
                  {scheduled ? 'Buka sesi agar praktikan dapat mulai mengisi presensi.' : 'Belum ada presensi masuk. Kehadiran muncul otomatis.'}
                </AssistantText>
              </View>
            ) : (
              <View style={styles.roster}>
                {attendanceRecords.map((rec, index) => {
                  const name = rec.userName;
                  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('');
                  return (
                    <View key={rec.id} style={[styles.person, index > 0 && styles.personBorder]}>
                      <View style={[styles.avatar, styles.presentAvatar]}>
                        <AssistantText style={styles.initials} tone="accent">{initials}</AssistantText>
                      </View>
                      <View style={styles.personIdentity}>
                        <AssistantText style={styles.personName}>{name}</AssistantText>
                        <AssistantText variant="caption" tone="secondary" style={styles.small}>{rec.userNim}</AssistantText>
                      </View>
                      <View style={styles.record}>
                        <AssistantText style={styles.recordTime} tone="primary">
                          {formatAttendanceTime(typeof rec.recordedAt === 'string' ? rec.recordedAt : new Date().toISOString())}
                        </AssistantText>
                        <AssistantText style={[styles.recordStatus, styles.presentText]} tone="secondary">Hadir</AssistantText>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </AssistantScreen>
      </View>
      {confirmation && (
        <SessionConfirmation
          session={sessionForConfirm}
          mode={confirmation}
          present={present}
          total={total}
          onCancel={() => setConfirmation(null)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  // Area sentuh 44 px; panah putih duduk langsung di gradien halaman.
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, lineHeight: 24, fontFamily: tokens.fonts.bold, color: theme.colors.onHero },
  headerSpacer: { width: 44 },
  identity: { gap: 14, padding: 20, paddingBottom: 52 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sessionNumberBadge: { marginLeft: -10, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: theme.colors.glassMuted, borderRadius: tokens.radius.pill },
  sessionNumber: { fontSize: 11, lineHeight: 16, fontFamily: fonts.mono, color: theme.colors.primary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: theme.colors.neutralSoft, borderRadius: tokens.radius.pill },
  activeBadge: { backgroundColor: theme.colors.lime },
  activeBadgeText: { color: theme.colors.onLime },
  badgeText: { fontSize: 11, lineHeight: 14, fontFamily: tokens.fonts.semibold },
  material: { gap: 3 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeMetaItem: { marginLeft: 'auto' },
  shrink: { flex: 1 },
  summary: { position: 'absolute', right: 0, bottom: 0, width: summaryDock.width, height: summaryDock.height, paddingHorizontal: 14, paddingVertical: 10, gap: 6, backgroundColor: theme.colors.primaryFill, borderRadius: summaryDock.radius },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  total: { flexDirection: 'row', gap: 4, alignItems: 'baseline' },
  count: { fontSize: 24, lineHeight: 29, letterSpacing: -0.8, fontFamily: tokens.fonts.bold, color: theme.colors.onPrimary },
  summaryText: { fontSize: 10, lineHeight: 16, color: theme.colors.onPrimarySoft },
  summaryPercent: { fontSize: 12, lineHeight: 18, fontFamily: tokens.fonts.bold, color: theme.colors.lime },
  progress: { height: 3, backgroundColor: theme.colors.heroLine, borderRadius: tokens.radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.lime, borderRadius: tokens.radius.pill },
  attendance: { gap: 12 },
  listHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  small: { fontSize: 11, lineHeight: 15 },
  roster: { backgroundColor: theme.colors.glassSurface, borderWidth: 1, borderColor: theme.colors.glassBorder, borderRadius: tokens.radius.card, overflow: 'hidden' },
  person: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 13, gap: 10, minHeight: 60 },
  personBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  avatar: { width: 34, height: 34, backgroundColor: theme.colors.neutralSoft, borderRadius: tokens.radius.pill, justifyContent: 'center', alignItems: 'center' },
  presentAvatar: { backgroundColor: theme.colors.primarySoft },
  initials: { fontSize: 11, lineHeight: 15, fontFamily: tokens.fonts.semibold },
  personIdentity: { flex: 1, gap: 4 },
  personName: { fontSize: 13, lineHeight: 18, fontFamily: tokens.fonts.semibold },
  record: { alignItems: 'flex-end', gap: 4, maxWidth: '35%' },
  recordTime: { fontSize: 12, lineHeight: 17, fontFamily: tokens.fonts.semibold },
  recordStatus: { fontSize: 10, lineHeight: 14, textAlign: 'right' },
  presentText: { color: theme.colors.success },
  empty: { paddingHorizontal: 22, paddingVertical: 46, gap: 16, alignItems: 'center', backgroundColor: theme.colors.glassSurface, borderWidth: 1, borderColor: theme.colors.glassBorder, borderRadius: tokens.radius.card },
  emptyIcon: { width: 84, height: 84, backgroundColor: theme.colors.primarySoft, borderRadius: tokens.radius.panel, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontFamily: tokens.fonts.bold, fontSize: 20, lineHeight: 27, textAlign: 'center' },
  center: { textAlign: 'center' },
  noRoster: { padding: 18 },
  closedNote: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: theme.colors.background, width: '100%', maxWidth: tokens.contentWidth, alignSelf: 'center' },
  button: { minHeight: 50, borderWidth: 1, borderRadius: tokens.radius.control, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primary: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
  secondary: { backgroundColor: theme.colors.glassSurface, borderColor: theme.colors.glassBorder },
  white: { color: theme.colors.onPrimary },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
});
