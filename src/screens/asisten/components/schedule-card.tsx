import { Pressable, StyleSheet, View } from 'react-native';

import { type AssistantSession, type AssistantAttendance, countAttendance, statusLabels } from '../schedule-data';
import { formatPraktikumName } from '../session-format';
import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';
import { AssistantGlassHighlight } from './assistant-atmosphere';
import { ScheduleIcon } from './schedule-icon';

export function ScheduleCard({ session, attendance, onManage }: {
  session: AssistantSession;
  attendance: readonly AssistantAttendance[];
  onManage?: (id: string) => void;
}) {
  const open = session.status === 'open';
  const pending = session.status === 'pending';
  const registered = new Set(session.participantIds).size;
  const present = countAttendance(session, attendance);
  const percentage = registered > 0 ? Math.round(present / registered * 100) : 0;

  return (
    <View style={[styles.card, open && styles.openCard]}>
      {open && <AssistantGlassHighlight />}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.timeRow}>
            <ScheduleIcon name="clock" size={15} />
            <AssistantText style={styles.time}>{session.startTime.replace(':', '.')}–{session.endTime.replace(':', '.')}</AssistantText>
          </View>
          <View style={[styles.badge, open && styles.openBadge]}>
            <ScheduleIcon name={open ? 'dotOpen' : 'dotNeutral'} size={5} />
            <AssistantText style={[styles.badgeText, open && styles.openBadgeText]} tone={open ? 'accent' : 'secondary'}>{statusLabels[session.status]}</AssistantText>
          </View>
        </View>
        <View style={styles.material}>
          <AssistantText accessibilityRole="header" style={styles.course}>{formatPraktikumName(session)}</AssistantText>
          <AssistantText tone="secondary" style={styles.topic}>{session.topic}</AssistantText>
        </View>
        <View style={styles.metadata}>
          <View style={styles.metaItem}>
            <ScheduleIcon name="pin" size={14} />
            <AssistantText variant="caption" tone="secondary" style={styles.metaText}>{session.room}</AssistantText>
          </View>
        </View>
        <View style={styles.attendance}>
          <View style={styles.attendanceHeading}>
            <AssistantText variant="caption" tone="secondary" style={styles.total}>
              {pending ? `${registered} praktikan terdaftar` : `${present} dari ${registered} praktikan hadir`}
            </AssistantText>
            {!pending && <AssistantText style={[styles.percentage, open && styles.accent]}>{registered > 0 ? `${percentage}%` : '—'}</AssistantText>}
          </View>
          {!pending && (
            <View style={styles.progressTrack} accessible accessibilityRole="progressbar"
              accessibilityLabel="Kehadiran praktikan"
              accessibilityValue={{ min: 0, max: registered, now: present, text: `${present} dari ${registered} praktikan hadir` }}>
              <View style={[styles.progressFill, { width: `${percentage}%` }, !open && styles.closedProgress]} />
            </View>
          )}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Pantau' : 'Kelola'} sesi ${formatPraktikumName(session)}`}
        accessibilityState={{ disabled: !onManage }}
        accessibilityHint={!onManage ? 'Pengelolaan sesi belum tersedia.' : undefined}
        disabled={!onManage}
        onPress={() => onManage?.(session.id)}
        style={({ pressed }) => [styles.action, open && styles.openAction, !onManage && styles.disabled, pressed && styles.pressed]}>
        <AssistantText style={[styles.actionText, open && styles.white]}>{open ? 'Pantau presensi' : 'Kelola sesi'}</AssistantText>
        <ScheduleIcon name={open ? 'arrowWhite' : 'arrow'} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 7, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', borderRadius: 28, boxShadow: '0 8px 28px rgba(30,65,125,0.07)' },
  openCard: { borderColor: '#FFFFFF', backgroundColor: 'rgba(235,243,255,0.75)' },
  content: { padding: 14, gap: 18 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  time: { fontSize: 12, lineHeight: 18, fontFamily: theme.fonts.semibold, fontVariant: ['tabular-nums'] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: theme.radius.pill, backgroundColor: 'rgba(222,232,248,0.65)' },
  openBadge: { backgroundColor: '#DEF1B4' },
  openBadgeText: { color: '#35501A' },
  badgeText: { fontSize: 10, lineHeight: 15, fontFamily: theme.fonts.semibold },
  material: { gap: 6 },
  course: { fontFamily: theme.fonts.bold, fontSize: 20, lineHeight: 27, letterSpacing: -0.5 },
  topic: { fontSize: 13, lineHeight: 20 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  metaText: { flexShrink: 1, fontSize: 11 },
  attendance: { gap: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(53,85,142,0.1)' },
  attendanceHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  total: { flex: 1, fontSize: 11 },
  percentage: { fontFamily: theme.fonts.bold, fontSize: 12, lineHeight: 18 },
  accent: { color: '#204CAC' },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(222,232,248,0.65)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#2856B9' },
  closedProgress: { backgroundColor: theme.colors.textSecondary },
  action: { minHeight: 46, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'space-between', borderRadius: 21, backgroundColor: 'rgba(222,232,248,0.65)' },
  openAction: { backgroundColor: '#2856B9' },
  actionText: { fontSize: 12, lineHeight: 18, fontFamily: theme.fonts.semibold, color: '#204CAC', flexShrink: 1 },
  white: { color: theme.colors.surface },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
