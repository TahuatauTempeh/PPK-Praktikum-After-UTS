import { Pressable, StyleSheet, View } from 'react-native';

import { type buildRecap } from '../recap-data';
import { type AssistantAttendance, type AssistantParticipant } from '../schedule-data';
import { formatPraktikumName, formatSessionDate } from '../session-format';
import {
  tokens,
  useThemedStyles,
  useTheme,
  type Theme,
} from '@/theme';
import { AssistantText } from './assistant-text';
import { AssistantGlassHighlight } from './assistant-atmosphere';
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
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const { session, present, total, absent, percent } = row;
  if (!expanded) return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ringkasan ${formatPraktikumName(session)}, ${session.topic}, ${formatSessionDate(session.date)}`}
      accessibilityState={{ expanded: false }} onPress={onExpand}
      style={({ pressed }) => [styles.compact, pressed && styles.pressed]}>
      <View style={styles.check}><ScheduleIcon name="check" size={18} tintColor={theme.colors.iconMuted} /></View>
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
      <AssistantGlassHighlight />
      <View style={styles.isi}>
        <View style={styles.topRow}>
          <AssistantText variant="caption" tone="secondary" style={[styles.small, styles.bold]}>{formatSessionDate(session.date).toUpperCase()}</AssistantText>
          <View style={styles.badge}>
            <ScheduleIcon name="dotNeutral" size={5} tintColor={theme.colors.iconMuted} />
            <AssistantText variant="caption" tone="secondary" style={styles.small}>Ditutup</AssistantText>
          </View>
        </View>
        <View style={styles.material}>
          <AssistantText style={styles.course} accessibilityRole="header">{formatPraktikumName(session)}</AssistantText>
          <AssistantText variant="greeting" tone="secondary" style={styles.topic}>{session.topic}</AssistantText>
          <AssistantText variant="caption" tone="secondary" style={styles.small}>
            {session.startTime.replace(':', '.')}–{session.endTime.replace(':', '.')} WIB | {session.room}
          </AssistantText>
        </View>
        <View style={styles.results}>
          <View style={styles.result}>
            <AssistantText style={styles.resultNumber} tone="accent">{present}</AssistantText>
            <AssistantText variant="caption" style={styles.bold}>Hadir</AssistantText>
            <AssistantText variant="caption" tone="secondary" style={styles.small}>{percent === null ? '—' : `${percent}%`} dari {total} praktikan</AssistantText>
          </View>
          <View style={styles.result}>
            <AssistantText style={styles.resultNumber}>{absent}</AssistantText>
            <AssistantText variant="caption" style={styles.bold}>Tidak hadir</AssistantText>
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
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Lihat detail presensi ${formatPraktikumName(session)}, ${session.topic}`}
        onPress={onDetail} style={({ pressed }) => [styles.detail, pressed && styles.pressed]}>
        <AssistantText tone="accent" style={styles.compactTitle}>Lihat detail presensi</AssistantText>
        <ScheduleIcon name="detailArrow" size={17} tintColor={theme.colors.primary} />
      </Pressable>
    </View>
  );
}
const gaya = (theme: Theme) => StyleSheet.create({
  card: { padding: 18, gap: 16, backgroundColor: theme.colors.glassSurface, borderWidth: 1, borderColor: theme.colors.glassBorder, borderRadius: tokens.radius.card, boxShadow: theme.colors.shadow },
  isi: { gap: 12 },
  compact: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, backgroundColor: theme.colors.glassSurface, borderWidth: 1, borderColor: theme.colors.glassBorder, borderRadius: tokens.radius.card, boxShadow: theme.colors.shadow },
  check: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: theme.colors.neutralSoft },
  compactIdentity: { flex: 1, gap: 5 },
  compactNumbers: { alignItems: 'flex-end', gap: 5, flexShrink: 1 },
  compactTitle: { fontSize: 13, lineHeight: 19, fontFamily: tokens.fonts.semibold },
  bold: { fontFamily: tokens.fonts.bold },
  small: { fontSize: 11, lineHeight: 16 },
  success: { color: theme.colors.success, fontSize: 11 },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: tokens.radius.pill, backgroundColor: theme.colors.neutralSoft },
  material: { gap: 5 },
  course: { fontFamily: tokens.fonts.bold, fontSize: 20, lineHeight: 27, letterSpacing: -0.5 },
  topic: { lineHeight: 19 },
  results: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  result: { flexGrow: 1, flexBasis: 130, gap: 5, padding: 12, borderRadius: 16, backgroundColor: theme.colors.glassMuted },
  resultNumber: { fontFamily: tokens.fonts.bold, fontSize: 30, lineHeight: 38 },
  progress: { height: 5, overflow: 'hidden', backgroundColor: theme.colors.neutralSoft, borderRadius: tokens.radius.pill },
  progressFill: { height: 5, borderRadius: tokens.radius.pill, backgroundColor: theme.colors.primaryFill },
  detail: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: tokens.radius.button, backgroundColor: theme.colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pressed: { opacity: 0.7 },
});
