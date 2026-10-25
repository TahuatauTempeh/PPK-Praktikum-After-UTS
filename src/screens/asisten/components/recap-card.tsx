import { Pressable, StyleSheet, View } from 'react-native';

import { type buildRecap } from '../recap-data';
import { type AssistantAttendance, type AssistantParticipant } from '../schedule-data';
import { formatPraktikumName, formatSessionDate } from '../session-format';
import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

type Props = {
  row: ReturnType<typeof buildRecap>['rows'][number];
  attendance: readonly AssistantAttendance[];
  participants: readonly AssistantParticipant[];
  expanded: boolean;
  onExpand: () => void;
  onDetail: () => void;
};
export function RecapCard({ row, attendance, participants, expanded, onExpand, onDetail }: Props) {
  const { session, present, total, absent, percent } = row;
  if (!expanded) return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ringkasan ${formatPraktikumName(session)}, ${session.topic}, ${formatSessionDate(session.date)}`}
      accessibilityState={{ expanded: false }} onPress={onExpand}
      style={({ pressed }) => [styles.compact, pressed && styles.pressed]}>
      <View style={styles.check}><ScheduleIcon name="check" size={18} /></View>
      <View style={styles.compactIdentity}>
        <AssistantText style={styles.compactTitle}>{session.topic}</AssistantText>
        <AssistantText variant="caption" tone="secondary">{formatPraktikumName(session)}</AssistantText>
        <AssistantText variant="caption" tone="secondary" style={styles.small}>{formatSessionDate(session.date)}</AssistantText>
      </View>
      <View style={styles.compactNumbers}>
        <AssistantText variant="label" style={styles.bold}>{present}/{total}</AssistantText>
        <AssistantText variant="caption" style={styles.success}>{percent === null ? '—' : `${percent}% hadir`}</AssistantText>
      </View>
    </Pressable>
  );

  const presentIds = new Set(attendance.filter(item => item.sessionId === session.id).map(item => item.participantId));
  const absentNames = [...new Set(session.participantIds)].filter(id => !presentIds.has(id))
    .map(id => participants.find(person => person.id === id)?.name ?? id);
  const absentPercent = total ? Math.round(absent / total * 100) : null;
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <AssistantText variant="caption" tone="secondary" style={[styles.small, styles.bold]}>{formatSessionDate(session.date).toUpperCase()}</AssistantText>
        <View style={styles.badge}>
          <ScheduleIcon name="dotNeutral" size={5} />
          <AssistantText variant="caption" tone="secondary" style={styles.small}>Ditutup</AssistantText>
        </View>
      </View>
      <View style={styles.material}>
        <AssistantText style={styles.course} accessibilityRole="header">{formatPraktikumName(session)}</AssistantText>
        <AssistantText variant="greeting" tone="secondary" style={styles.topic}>{session.topic}</AssistantText>
        <AssistantText variant="caption" tone="secondary" style={styles.small}>
          {session.startTime.replace(':', '.')}–{session.endTime.replace(':', '.')} WIB · {session.room}
        </AssistantText>
      </View>
      <View style={styles.results}>
        <View style={styles.result}>
          <AssistantText style={styles.resultNumber} tone="accent">{present} hadir</AssistantText>
          <AssistantText variant="caption" tone="secondary" style={styles.small}>{percent === null ? '—' : `${percent}%`} dari {total} praktikan</AssistantText>
        </View>
        <View style={styles.result}>
          <AssistantText style={styles.resultNumber}>{absent} tidak hadir</AssistantText>
          <AssistantText variant="caption" tone="secondary" style={styles.small}>{absentPercent === null ? '—' : `${absentPercent}%`} dari {total} praktikan</AssistantText>
        </View>
      </View>
      <View accessibilityRole="progressbar" accessibilityLabel="Proporsi hadir"
        accessibilityValue={percent === null ? { text: 'Belum ada praktikan terdaftar' } : { min: 0, max: 100, now: percent }} style={styles.progress}>
        <View style={[styles.progressFill, { width: `${total ? present / total * 100 : 0}%` }]} />
      </View>
      <View style={styles.material}>
        <AssistantText variant="caption" tone="secondary" style={[styles.small, styles.bold]}>Tidak hadir</AssistantText>
        <AssistantText variant="caption">{absentNames.join(', ') || 'Tidak ada'}</AssistantText>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Lihat detail presensi ${formatPraktikumName(session)}, ${session.topic}`}
        onPress={onDetail} style={({ pressed }) => [styles.detail, pressed && styles.pressed]}>
        <AssistantText tone="accent" style={styles.compactTitle}>Lihat detail presensi</AssistantText>
        <ScheduleIcon name="detailArrow" size={17} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 18, gap: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radius.card },
  compact: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card },
  check: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: theme.colors.neutralSoft },
  compactIdentity: { flex: 1, gap: 5 },
  compactNumbers: { alignItems: 'flex-end', gap: 5, flexShrink: 1 },
  compactTitle: { fontSize: 13, lineHeight: 19, fontFamily: theme.fonts.semibold },
  bold: { fontFamily: theme.fonts.bold },
  small: { fontSize: 11, lineHeight: 16 },
  success: { color: theme.colors.success, fontSize: 11 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: theme.radius.pill, backgroundColor: theme.colors.neutralSoft },
  material: { gap: 5 },
  course: { fontFamily: theme.fonts.bold, fontSize: 19, lineHeight: 25 },
  topic: { lineHeight: 19 },
  results: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  result: { flexGrow: 1, flexBasis: 130, gap: 5 },
  resultNumber: { fontFamily: theme.fonts.bold, fontSize: 23, lineHeight: 30 },
  progress: { height: 5, overflow: 'hidden', backgroundColor: theme.colors.neutralSoft, borderRadius: theme.radius.pill },
  progressFill: { height: 5, borderRadius: theme.radius.pill, backgroundColor: theme.colors.primary },
  detail: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pressed: { opacity: 0.7 },
});
