import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { ScheduleIcon } from './components/schedule-icon';
import { SessionCardSurface, summaryDock } from './components/session-card-surface';
import { SessionConfirmation } from './components/session-confirmation';
import { useAssistantSessions } from './preview-session-provider';
import { countAttendance, statusLabels } from './schedule-data';
import { formatAttendanceTime, formatPraktikumName, formatSessionDate, splitSessionTopic } from './session-format';
import { assistantTheme as theme } from './theme';

type Props = { id: string; onBack: () => void; onRecap?: (id: string) => void };

export default function SessionScreen({ id, onBack, onRecap }: Props) {
  const { sessions, attendance, participants, openSession, closeSession } = useAssistantSessions();
  const [confirmation, setConfirmation] = useState<'open' | 'close' | null>(null);
  const [feedback, setFeedback] = useState('');
  const session = sessions.find(item => item.id === id);

  const header = (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kembali" onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <ScheduleIcon name="back" size={20} />
      </Pressable>
      <AssistantText style={styles.headerTitle} accessibilityRole="header">Kelola sesi</AssistantText>
    </View>
  );

  if (!session) return (
    <AssistantScreen>
      {header}
      <View style={styles.empty}>
        <AssistantText style={styles.emptyTitle}>Sesi tidak ditemukan</AssistantText>
        <AssistantText tone="secondary" style={styles.center}>Sesi ini tidak tersedia. Kembali ke jadwal untuk memilih sesi lainnya.</AssistantText>
        <Pressable accessibilityRole="button" onPress={onBack} style={[styles.button, styles.primary]}>
          <AssistantText variant="label" style={styles.white}>Kembali ke jadwal</AssistantText>
        </Pressable>
      </View>
    </AssistantScreen>
  );

  const sessionTopic = splitSessionTopic(session.topic);
  const pending = session.status === 'pending';
  const open = session.status === 'open';
  const closed = session.status === 'closed';
  const rosterIds = [...new Set(session.participantIds)];
  const total = rosterIds.length;
  const present = countAttendance(session, attendance);
  const percent = total ? Math.round(present / total * 100) : null;
  const records = attendance.filter(item => item.sessionId === session.id);
  const actionDisabled = closed && !onRecap;

  function confirm() {
    if (confirmation === 'open' && pending) {
      openSession(id);
      setFeedback('Sesi berhasil dibuka.');
    } else if (confirmation === 'close' && open) {
      closeSession(id);
      setFeedback('Sesi berhasil ditutup.');
    }
    setConfirmation(null);
  }

  return (
    <>
      <View style={styles.screen} aria-hidden={confirmation !== null}
        importantForAccessibility={confirmation ? 'no-hide-descendants' : 'auto'}>
      <AssistantScreen footer={
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" disabled={actionDisabled}
            accessibilityState={{ disabled: actionDisabled }}
            accessibilityHint={actionDisabled ? 'Rekap sesi belum tersedia.' : undefined}
            onPress={() => {
              if (closed) onRecap?.(id);
              else setConfirmation(pending ? 'open' : 'close');
            }}
            style={({ pressed }) => [styles.button, open ? styles.secondary : styles.primary, actionDisabled && styles.disabled, pressed && styles.pressed]}>
            <ScheduleIcon name={pending ? 'doorOpenWhite' : open ? 'lock' : 'chartWhite'} size={18} />
            <AssistantText variant="label" tone="accent" style={!open && styles.white}>
              {pending ? 'Buka sesi' : open ? 'Tutup sesi' : 'Lihat rekap sesi'}
            </AssistantText>
          </Pressable>
        </View>
      }>
        {header}
        <SessionCardSurface>
          <View style={styles.identity}>
            <View style={styles.topRow}>
              {sessionTopic.number && (
                <View style={styles.sessionNumberBadge}>
                  <AssistantText style={styles.sessionNumber}>SESI KE-{sessionTopic.number}</AssistantText>
                </View>
              )}
              <View style={[styles.badge, open && styles.activeBadge]}>
                <ScheduleIcon name={open ? 'dotOpen' : 'dotNeutral'} size={5} />
                <AssistantText style={[styles.badgeText, open && styles.activeBadgeText]} tone={open ? 'accent' : 'secondary'}>{statusLabels[session.status]}</AssistantText>
              </View>
            </View>
            <View style={styles.material}>
              <AssistantText variant="detailTitle" accessibilityRole="header">{formatPraktikumName(session)}</AssistantText>
              <AssistantText tone="secondary">{sessionTopic.topic}</AssistantText>
            </View>
            <View style={styles.metadata}>
              <View style={styles.metaItem}>
                <ScheduleIcon name="calendarSmall" size={15} />
                <AssistantText variant="caption" tone="secondary">{formatSessionDate(session.date)}</AssistantText>
              </View>
              <View style={[styles.metaItem, styles.timeMetaItem]}>
                <ScheduleIcon name="clock" size={15} />
                <AssistantText variant="caption" tone="secondary">{session.startTime.replace(':', '.')}–{session.endTime.replace(':', '.')}</AssistantText>
              </View>
            </View>
            <View style={styles.metaItem}>
              <ScheduleIcon name="pin" size={15} />
              <AssistantText variant="caption" tone="secondary" style={styles.shrink}>{session.room}</AssistantText>
            </View>
          </View>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <View style={styles.total}>
                <AssistantText style={styles.count}>{present}</AssistantText>
                <AssistantText style={styles.summaryText}>/ {total} hadir</AssistantText>
              </View>
              <AssistantText style={styles.summaryPercent}>{percent === null ? '—' : `${percent}%`}</AssistantText>
            </View>
            <View style={styles.progress} accessibilityRole="progressbar"
              accessibilityLabel="Persentase kehadiran" accessibilityValue={percent === null
                ? { text: 'Belum ada praktikan terdaftar' } : { min: 0, max: 100, now: percent }}>
              <View style={[styles.progressFill, { width: `${total ? present / total * 100 : 0}%` }]} />
            </View>
          </View>
        </SessionCardSurface>
        {feedback !== '' && <AssistantText variant="caption" tone="accent" accessibilityLiveRegion="polite">{feedback}</AssistantText>}
        <View style={styles.attendance}>
          <View style={styles.listHeading}>
            <AssistantText variant="sectionTitle" accessibilityRole="header">{closed ? 'Hasil presensi' : 'Presensi praktikan'}</AssistantText>
          </View>
          {pending || (open && present === 0) ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><ScheduleIcon name={pending ? 'doorClosed' : 'users'} size={34} /></View>
              <AssistantText style={styles.emptyTitle} accessibilityRole="header">{pending ? 'Sesi belum dibuka' : 'Menunggu praktikan'}</AssistantText>
              <AssistantText tone="secondary" style={styles.center}>{pending
                ? `Buka sesi agar ${total} praktikan dapat mulai mengisi presensi.`
                : 'Belum ada presensi masuk. Kehadiran akan muncul otomatis saat praktikan mengisi presensi.'}</AssistantText>
            </View>
          ) : (
            <View style={styles.roster} accessibilityLiveRegion="polite">
              {rosterIds.map((participantId, index) => {
                const person = participants.find(item => item.id === participantId);
                const record = records.find(item => item.participantId === participantId);
                const name = person?.name ?? participantId;
                const initials = name.split(' ').slice(0, 2).map(word => word[0]).join('');
                return (
                  <View key={participantId} style={[styles.person, index > 0 && styles.personBorder]}>
                    <View style={[styles.avatar, record && styles.presentAvatar]}>
                      <AssistantText style={styles.initials} tone={record ? 'accent' : 'secondary'}>{initials}</AssistantText>
                    </View>
                    <View style={styles.personIdentity}>
                      <AssistantText style={styles.personName}>{name}</AssistantText>
                      <AssistantText variant="caption" tone="secondary" style={styles.small}>{participantId}</AssistantText>
                    </View>
                    <View style={styles.record}>
                      <AssistantText style={styles.recordTime} tone={record ? 'primary' : 'secondary'}>{record ? formatAttendanceTime(record.recordedAt) : '—'}</AssistantText>
                      <AssistantText style={[styles.recordStatus, record && styles.presentText]} tone="secondary">
                        {record ? 'Hadir' : closed ? 'Tidak hadir' : 'Belum hadir'}
                      </AssistantText>
                    </View>
                  </View>
                );
              })}
              {total === 0 && <AssistantText tone="secondary" style={styles.noRoster}>Belum ada praktikan terdaftar untuk sesi ini.</AssistantText>}
            </View>
          )}
        </View>
        {closed && session.closedAt && <View style={styles.closedNote}>
          <ScheduleIcon name="lockSmall" size={13} />
          <AssistantText variant="caption" tone="secondary" style={styles.shrink}>
            Ditutup {new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(session.closedAt))} WIB oleh {session.closedBy}.
          </AssistantText>
        </View>}
      </AssistantScreen>
      </View>
      {confirmation && <SessionConfirmation session={session} mode={confirmation} present={present} total={total}
        onCancel={() => setConfirmation(null)} onConfirm={confirm} />}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)', borderRadius: 16 },
  headerTitle: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 18, lineHeight: 24, fontFamily: theme.fonts.bold, color: theme.colors.surface },
  identity: { gap: 14, padding: 20, paddingBottom: 52 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sessionNumberBadge: { marginLeft: -10, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: theme.radius.pill },
  sessionNumber: { fontSize: 11, lineHeight: 16, fontFamily: Fonts.mono, fontWeight: '500', color: theme.colors.primary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: theme.colors.neutralSoft, borderRadius: theme.radius.pill },
  activeBadge: { backgroundColor: theme.colors.lime },
  activeBadgeText: { color: '#35501A' },
  badgeText: { fontSize: 11, lineHeight: 14, fontFamily: theme.fonts.semibold },
  material: { gap: 3 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeMetaItem: { marginLeft: 'auto' },
  shrink: { flex: 1 },
  summary: { position: 'absolute', right: 0, bottom: 0, width: summaryDock.width, height: summaryDock.height, paddingHorizontal: 14, paddingVertical: 10, gap: 6, backgroundColor: theme.colors.primary, borderRadius: summaryDock.radius },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  total: { flexDirection: 'row', gap: 4, alignItems: 'baseline' },
  count: { fontSize: 24, lineHeight: 29, letterSpacing: -0.8, fontFamily: theme.fonts.bold, color: theme.colors.surface },
  summaryText: { fontSize: 10, lineHeight: 16, color: '#E3EDFF' },
  summaryPercent: { fontSize: 12, lineHeight: 18, fontFamily: theme.fonts.bold, color: theme.colors.lime },
  progress: { height: 3, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: theme.radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.lime, borderRadius: theme.radius.pill },
  attendance: { gap: 12 },
  listHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  small: { fontSize: 11, lineHeight: 15 },
  roster: { backgroundColor: theme.colors.glassSurface, borderWidth: 1, borderColor: theme.colors.glassBorder, borderRadius: theme.radius.card, overflow: 'hidden' },
  person: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 13, gap: 10, minHeight: 60 },
  personBorder: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  avatar: { width: 34, height: 34, backgroundColor: theme.colors.neutralSoft, borderRadius: theme.radius.pill, justifyContent: 'center', alignItems: 'center' },
  presentAvatar: { backgroundColor: theme.colors.primarySoft },
  initials: { fontSize: 11, lineHeight: 15, fontFamily: theme.fonts.semibold },
  personIdentity: { flex: 1, gap: 4 },
  personName: { fontSize: 13, lineHeight: 18, fontFamily: theme.fonts.semibold },
  record: { alignItems: 'flex-end', gap: 4, maxWidth: '35%' },
  recordTime: { fontSize: 12, lineHeight: 17, fontFamily: theme.fonts.semibold },
  recordStatus: { fontSize: 10, lineHeight: 14, textAlign: 'right' },
  presentText: { color: theme.colors.success },
  empty: { paddingHorizontal: 22, paddingVertical: 46, gap: 16, alignItems: 'center', backgroundColor: theme.colors.glassSurface, borderWidth: 1, borderColor: theme.colors.glassBorder, borderRadius: theme.radius.card },
  emptyIcon: { width: 84, height: 84, backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.panel, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontFamily: theme.fonts.bold, fontSize: 20, lineHeight: 27, textAlign: 'center' },
  center: { textAlign: 'center' },
  noRoster: { padding: 18 },
  closedNote: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: theme.colors.background, width: '100%', maxWidth: 600, alignSelf: 'center' },
  button: { minHeight: 50, borderWidth: 1, borderRadius: theme.radius.control, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.glassSurface, borderColor: theme.colors.glassBorder },
  white: { color: theme.colors.surface },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
});
