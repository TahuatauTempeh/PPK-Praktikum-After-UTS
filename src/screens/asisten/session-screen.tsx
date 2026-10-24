import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { ScheduleIcon } from './components/schedule-icon';
import { SessionConfirmation } from './components/session-confirmation';
import { useAssistantSessions } from './preview-session-provider';
import { countAttendance, statusLabels } from './schedule-data';
import { formatAttendanceTime, formatSessionDate } from './session-format';
import { assistantTheme as theme } from './theme';

type Props = { id: string; onBack: () => void; onRecap?: (id: string) => void };

export default function SessionScreen({ id, onBack, onRecap }: Props) {
  const { sessions, attendance, participants, openSession, closeSession } = useAssistantSessions();
  const [confirmation, setConfirmation] = useState<'open' | 'close' | null>(null);
  const [feedback, setFeedback] = useState('');
  const session = sessions.find(item => item.id === id);

  const header = (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kembali ke jadwal" onPress={onBack}
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
        <View style={styles.identity}>
          <View style={styles.topRow}>
            <AssistantText variant="caption" tone="secondary" style={styles.className}>PRAKTIKUM · {session.className}</AssistantText>
            <View style={[styles.badge, open && styles.activeBadge]}>
              <ScheduleIcon name={open ? 'dotOpen' : 'dotNeutral'} size={5} />
              <AssistantText style={styles.badgeText} tone={open ? 'accent' : 'secondary'}>{statusLabels[session.status]}</AssistantText>
            </View>
          </View>
          <View style={styles.material}>
            <AssistantText variant="detailTitle" accessibilityRole="header">{session.course}</AssistantText>
            <AssistantText tone="secondary">{session.topic}</AssistantText>
          </View>
          <View style={styles.metadata}>
            <View style={styles.metaItem}>
              <ScheduleIcon name="calendarSmall" size={15} />
              <AssistantText variant="caption" tone="secondary">{formatSessionDate(session.date)}</AssistantText>
            </View>
            <View style={styles.metaItem}>
              <ScheduleIcon name="clock" size={15} />
              <AssistantText variant="caption" tone="secondary">{session.startTime.replace(':', '.')}–{session.endTime.replace(':', '.')} WIB</AssistantText>
            </View>
          </View>
          <View style={styles.metaItem}>
            <ScheduleIcon name="pin" size={15} />
            <AssistantText variant="caption" tone="secondary" style={styles.shrink}>{session.room}</AssistantText>
          </View>
        </View>
        {feedback !== '' && <AssistantText variant="caption" tone="accent" accessibilityLiveRegion="polite">{feedback}</AssistantText>}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <View style={styles.total}>
              <AssistantText style={styles.count} tone="accent">{present}</AssistantText>
              <AssistantText variant="greeting" tone="accent">/ {total} hadir</AssistantText>
            </View>
            <View style={styles.summaryDetails}>
              <AssistantText variant="sectionTitle" tone="accent">{percent === null ? '—' : `${percent}%`}</AssistantText>
              <AssistantText variant="caption" tone="secondary" style={styles.summaryCaption}>
                {total - present} {closed ? 'tidak hadir · hasil akhir' : 'belum presensi'}
              </AssistantText>
            </View>
          </View>
          <View style={styles.progress} accessibilityRole="progressbar"
            accessibilityLabel="Persentase kehadiran" accessibilityValue={percent === null
              ? { text: 'Belum ada praktikan terdaftar' } : { min: 0, max: 100, now: percent }}>
            <View style={[styles.progressFill, { width: `${total ? present / total * 100 : 0}%` }]} />
          </View>
        </View>
        <View style={styles.attendance}>
          <View style={styles.listHeading}>
            <AssistantText variant="sectionTitle" accessibilityRole="header">{closed ? 'Hasil presensi' : 'Presensi praktikan'}</AssistantText>
            <View style={styles.live}>
              {open && <ScheduleIcon name="liveDot" size={5} />}
              <AssistantText variant="caption" tone="secondary" style={styles.small}>{pending ? 'Belum dimulai' : open ? 'Waktu nyata' : 'Hanya lihat'}</AssistantText>
            </View>
          </View>
          {pending || (open && present === 0) ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><ScheduleIcon name={pending ? 'doorClosed' : 'users'} size={34} /></View>
              <AssistantText style={styles.emptyTitle} accessibilityRole="header">{pending ? 'Sesi belum dibuka' : 'Menunggu praktikan'}</AssistantText>
              <AssistantText tone="secondary" style={styles.center}>{pending
                ? `Buka sesi agar ${total} praktikan kelas ${session.className} dapat mulai mengisi presensi.`
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
        <AssistantText variant="caption" tone="secondary">Data contoh · perubahan sementara akan direset saat aplikasi dimuat ulang.</AssistantText>
      </AssistantScreen>
      </View>
      {confirmation && <SessionConfirmation session={session} mode={confirmation} present={present} total={total}
        onCancel={() => setConfirmation(null)} onConfirm={confirm} />}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18, lineHeight: 24, fontFamily: theme.fonts.bold },
  identity: { gap: 10 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  className: { fontSize: 11, fontFamily: theme.fonts.bold },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: theme.colors.neutralSoft, borderRadius: theme.radius.pill },
  activeBadge: { backgroundColor: theme.colors.primarySoft },
  badgeText: { fontSize: 11, lineHeight: 14, fontFamily: theme.fonts.semibold },
  material: { gap: 3 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shrink: { flex: 1 },
  summary: { padding: 16, gap: 12, backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.card },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  total: { flexDirection: 'row', gap: 7, alignItems: 'baseline' },
  count: { fontSize: 30, lineHeight: 38, fontFamily: theme.fonts.bold },
  summaryDetails: { alignItems: 'flex-end', gap: 5, flexShrink: 1 },
  summaryCaption: { fontSize: 11, textAlign: 'right' },
  progress: { height: 5, backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill, overflow: 'hidden' },
  progressFill: { height: 5, backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill },
  attendance: { gap: 12 },
  listHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  live: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  small: { fontSize: 11, lineHeight: 15 },
  roster: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, overflow: 'hidden' },
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
  empty: { paddingHorizontal: 22, paddingVertical: 46, gap: 16, alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card },
  emptyIcon: { width: 84, height: 84, backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.panel, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontFamily: theme.fonts.bold, fontSize: 20, lineHeight: 27, textAlign: 'center' },
  center: { textAlign: 'center' },
  noRoster: { padding: 18 },
  closedNote: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  footer: { paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface, width: '100%', maxWidth: 600, alignSelf: 'center' },
  button: { minHeight: 50, borderWidth: 1, borderRadius: theme.radius.control, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  white: { color: theme.colors.surface },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
});
