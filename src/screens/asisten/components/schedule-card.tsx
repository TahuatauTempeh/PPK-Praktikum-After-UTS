import { Pressable, StyleSheet, View } from 'react-native';

import { type AssistantSession, type AssistantAttendance, countAttendance, statusLabels } from '../schedule-data';
import { formatPraktikumName } from '../session-format';
import {
  tokens,
  useThemedStyles,
  useTheme,
  type Theme,
} from '@/theme';
import { AssistantText } from './assistant-text';
import { AssistantGlassHighlight } from './assistant-atmosphere';
import { ScheduleIcon } from './schedule-icon';

export function ScheduleCard({ session, attendance, onManage }: {
  session: AssistantSession;
  attendance: readonly AssistantAttendance[];
  onManage?: (id: string) => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
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
            <ScheduleIcon name="clock" size={15} tintColor={theme.colors.iconMuted} />
            <AssistantText style={styles.time}>{session.startTime.replace(':', '.')}–{session.endTime.replace(':', '.')}</AssistantText>
          </View>
          <View style={[styles.badge, open && styles.openBadge]}>
            <ScheduleIcon name={open ? 'dotOpen' : 'dotNeutral'} size={5}
              tintColor={open ? theme.colors.primary : theme.colors.iconMuted} />
            <AssistantText style={[styles.badgeText, open && styles.openBadgeText]} tone={open ? 'accent' : 'secondary'}>{statusLabels[session.status]}</AssistantText>
          </View>
        </View>
        <View style={styles.material}>
          <AssistantText accessibilityRole="header" style={styles.course}>{formatPraktikumName(session)}</AssistantText>
          <AssistantText tone="secondary" style={styles.topic}>{session.topic}</AssistantText>
        </View>
        <View style={styles.metadata}>
          <View style={styles.metaItem}>
            <ScheduleIcon name="pin" size={14} tintColor={theme.colors.iconMuted} />
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
        style={({ pressed }) => [styles.action, !onManage && styles.disabled, pressed && styles.pressed]}>
        <AssistantText style={styles.actionText}>{open ? 'Pantau presensi' : 'Kelola sesi'}</AssistantText>
        <ScheduleIcon name="arrow" size={18} tintColor={theme.colors.primary} />
      </Pressable>
    </View>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  card: { padding: 18, gap: 16, backgroundColor: theme.colors.glassCard, borderWidth: 1, borderColor: theme.colors.glassBorder, borderRadius: tokens.radius.card, boxShadow: theme.colors.shadow },
  openCard: { borderColor: theme.colors.glassBorder, backgroundColor: theme.colors.cardOpen },
  content: { gap: 18 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  time: { fontSize: 12, lineHeight: 18, fontFamily: tokens.fonts.semibold, fontVariant: ['tabular-nums'] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: tokens.radius.pill, backgroundColor: theme.colors.softSurface },
  openBadge: { backgroundColor: theme.colors.lime },
  openBadgeText: { color: theme.colors.onLime },
  badgeText: { fontSize: 10, lineHeight: 15, fontFamily: tokens.fonts.semibold },
  material: { gap: 6 },
  course: { fontFamily: tokens.fonts.bold, fontSize: 20, lineHeight: 27, letterSpacing: -0.5 },
  topic: { fontSize: 13, lineHeight: 20 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  metaText: { flexShrink: 1, fontSize: 11 },
  attendance: { gap: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.hairline },
  attendanceHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  total: { flex: 1, fontSize: 11 },
  percentage: { fontFamily: tokens.fonts.bold, fontSize: 12, lineHeight: 18 },
  accent: { color: theme.colors.primary },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: theme.colors.softSurface, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: theme.colors.primaryFill },
  closedProgress: { backgroundColor: theme.colors.textSecondary },
  action: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'space-between', borderRadius: 21, backgroundColor: theme.colors.softSurface },
  actionText: { fontSize: 12, lineHeight: 18, fontFamily: tokens.fonts.semibold, color: theme.colors.primary, flexShrink: 1 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
