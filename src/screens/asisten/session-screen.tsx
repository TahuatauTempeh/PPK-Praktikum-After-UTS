import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useSessionManage } from '@/lib/useSessionFirestore';
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
import { useAssistantSessions } from './preview-session-provider';
import { countAttendance, statusLabels } from './schedule-data';
import { formatAttendanceTime, formatPraktikumName, formatSessionDate, splitSessionTopic } from './session-format';

/**
 * Props:
 *  - id          : ID sesi (preview/dummy)
 *  - firestoreId : jika diisi, screen akan terhubung ke Firestore realtime
 *                  dan mengabaikan data preview untuk sesi tersebut.
 */
type Props = { id: string; firestoreId?: string; onBack: () => void; onRecap?: (id: string) => void };

// ─── Firestore hook (hanya aktif jika firestoreId diisi) ─────────────────────

function FirestoreSessionScreen({ firestoreId, onBack, onRecap }: { firestoreId: string; onBack: () => void; onRecap?: (id: string) => void }) {
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

  if (!fsSession) return (
    <AssistantScreen>
      {header}
      <View style={styles.empty}>
        <AssistantText style={styles.emptyTitle}>Sesi tidak ditemukan</AssistantText>
        <AssistantText tone="secondary" style={styles.center}>Sesi ini tidak tersedia di Firestore.</AssistantText>
        <Pressable accessibilityRole="button" onPress={onBack} style={[styles.button, styles.primary]}>
          <AssistantText variant="label" style={styles.white}>Kembali ke jadwal</AssistantText>
        </Pressable>
      </View>
    </AssistantScreen>
  );

  const scheduled = fsSession.status === 'scheduled';
  const open = fsSession.status === 'open';
  const closed = fsSession.status === 'closed';
  const present = attendanceRecords.length;
  // Karena data peserta dari Dev 2, sementara total dihitung dari attendance
  const total = present; // akan diperbarui Dev 2
  const percent = total ? 100 : null;
  const actionDisabled = (closed && !onRecap) || actionLoading;

  // Buat objek session-like untuk SessionConfirmation (kompatibel dengan tipe preview)
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
            <Pressable accessibilityRole="button" disabled={actionDisabled}
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

// ─── Main SessionScreen: Firestore jika firestoreId ada, preview jika tidak ──

export default function SessionScreen({ id, firestoreId, onBack, onRecap }: Props) {
  // Jika firestoreId diberikan, tampilkan screen berbasis Firestore
  if (firestoreId) {
    return <FirestoreSessionScreen firestoreId={firestoreId} onBack={onBack} onRecap={onRecap} />;
  }

  // Fallback: data preview (dummy) — backward-compatible
  return <PreviewSessionScreen id={id} onBack={onBack} onRecap={onRecap} />;
}

function PreviewSessionScreen({ id, onBack, onRecap }: { id: string; onBack: () => void; onRecap?: (id: string) => void }) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const { sessions, attendance, participants, openSession, closeSession } = useAssistantSessions();
  const [confirmation, setConfirmation] = useState<'open' | 'close' | null>(null);
  const [feedback, setFeedback] = useState('');
  const session = sessions.find(item => item.id === id);

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
            <ScheduleIcon name={pending ? 'doorOpenWhite' : open ? 'lock' : 'chartWhite'} size={18}
              tintColor={open ? theme.colors.primary : undefined} />
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
                <ScheduleIcon name={open ? 'dotOpen' : 'dotNeutral'} size={5}
                  tintColor={open ? theme.colors.primary : theme.colors.iconMuted} />
                <AssistantText style={[styles.badgeText, open && styles.activeBadgeText]} tone={open ? 'accent' : 'secondary'}>{statusLabels[session.status]}</AssistantText>
              </View>
            </View>
            <View style={styles.material}>
              <AssistantText variant="detailTitle" accessibilityRole="header">{formatPraktikumName(session)}</AssistantText>
              <AssistantText tone="secondary">{sessionTopic.topic}</AssistantText>
            </View>
            <View style={styles.metadata}>
              <View style={styles.metaItem}>
                <ScheduleIcon name="calendarSmall" size={15} tintColor={theme.colors.iconMuted} />
                <AssistantText variant="caption" tone="secondary">{formatSessionDate(session.date)}</AssistantText>
              </View>
              <View style={[styles.metaItem, styles.timeMetaItem]}>
                <ScheduleIcon name="clock" size={15} tintColor={theme.colors.iconMuted} />
                <AssistantText variant="caption" tone="secondary">{session.startTime.replace(':', '.')}–{session.endTime.replace(':', '.')}</AssistantText>
              </View>
            </View>
            <View style={styles.metaItem}>
              <ScheduleIcon name="pin" size={15} tintColor={theme.colors.iconMuted} />
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
              <View style={styles.emptyIcon}><ScheduleIcon name={pending ? 'doorClosed' : 'users'} size={34}
                tintColor={theme.colors.primary} /></View>
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
          <ScheduleIcon name="lockSmall" size={13} tintColor={theme.colors.iconMuted} />
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
