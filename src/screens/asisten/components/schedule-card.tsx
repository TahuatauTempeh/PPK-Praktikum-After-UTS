import { Pressable, StyleSheet, View } from 'react-native';

import { type AssistantSession, type AssistantAttendance, countAttendance, statusLabels } from '../schedule-data';
import { formatPraktikumName } from '../session-format';
import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

export function ScheduleCard({ session, attendance, onManage }: {
  session: AssistantSession;
  attendance: readonly AssistantAttendance[];
  onManage?: (id: string) => void;
}) {
  const open = session.status === 'open';
  const registered = new Set(session.participantIds).size;
  return (
    <View style={[styles.card, open && styles.openCard]}>
      <View style={styles.topRow}>
        <View style={[styles.badge, open && styles.openBadge]}>
          <ScheduleIcon name={open ? 'dotOpen' : 'dotNeutral'} size={5} />
          <AssistantText style={styles.badgeText} tone={open ? 'accent' : 'secondary'}>{statusLabels[session.status]}</AssistantText>
        </View>
      </View>
      <View style={styles.material}>
        <AssistantText accessibilityRole="header" style={styles.course}>{formatPraktikumName(session)}</AssistantText>
        <AssistantText variant="greeting" tone="secondary" style={styles.topic}>{session.topic}</AssistantText>
      </View>
      <View style={styles.metadata}>
        <View style={styles.metaItem}>
          <ScheduleIcon name="clock" size={15} />
          <AssistantText variant="caption" tone="secondary" style={styles.metaText}>
            {session.startTime.replace(':', '.')}–{session.endTime.replace(':', '.')} WIB
          </AssistantText>
        </View>
        <View style={styles.metaItem}>
          <ScheduleIcon name="pin" size={15} />
          <AssistantText variant="caption" tone="secondary" style={styles.metaText}>{session.room}</AssistantText>
        </View>
      </View>
      <View style={styles.footer}>
        <AssistantText variant="caption" tone="secondary" style={styles.total}>
          {session.status === 'pending' ? `${registered} praktikan terdaftar` : `${countAttendance(session, attendance)} dari ${registered} praktikan hadir`}
        </AssistantText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${open ? 'Pantau' : 'Kelola'} sesi ${formatPraktikumName(session)}`}
          accessibilityState={{ disabled: !onManage }}
          accessibilityHint={!onManage ? 'Pengelolaan sesi belum tersedia.' : undefined}
          disabled={!onManage}
          onPress={() => onManage?.(session.id)}
          style={({ pressed }) => [styles.action, !onManage && styles.disabled, pressed && styles.pressed]}>
          <AssistantText tone="accent" style={styles.actionText}>{open ? 'Pantau sesi' : 'Kelola sesi'}</AssistantText>
          <ScheduleIcon name="arrow" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, gap: 13, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card },
  openCard: { borderColor: theme.colors.primary },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: theme.radius.pill, backgroundColor: theme.colors.neutralSoft },
  openBadge: { backgroundColor: theme.colors.primarySoft },
  badgeText: { fontSize: 11, lineHeight: 14, fontFamily: theme.fonts.semibold },
  material: { gap: 5 },
  course: { fontFamily: theme.fonts.bold, fontSize: 19, lineHeight: 25 },
  topic: { lineHeight: 19 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  metaText: { flexShrink: 1 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
  total: { flexGrow: 1, flexBasis: 130 },
  action: { minHeight: 44, flexDirection: 'row', gap: 5, alignItems: 'center' },
  actionText: { fontSize: 13, fontFamily: theme.fonts.bold },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
