import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AssistantHeader } from './components/assistant-header';
import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { ScheduleCard } from './components/schedule-card';
import { ScheduleIcon } from './components/schedule-icon';
import {
  type AssistantSession, type AssistantAttendance, type SessionStatus,
  previewAttendance, previewDate, previewSessions, statusLabels,
} from './schedule-data';
import { assistantTheme as theme } from './theme';

type Filter = 'all' | SessionStatus;
const filters: readonly Filter[] = ['all', 'pending', 'open', 'closed'];

type Props = {
  sessions?: readonly AssistantSession[];
  attendance?: readonly AssistantAttendance[];
  date?: string;
  feedback?: string;
  onAdd?: () => void;
  onManage?: (id: string) => void;
};

export default function ScheduleScreen({
  sessions = previewSessions, attendance = previewAttendance, date = previewDate,
  onAdd, onManage, feedback,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const daySessions = sessions.filter(session => session.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const visible = daySessions.filter(session => filter === 'all' || session.status === filter);
  const openCount = daySessions.filter(session => session.status === 'open').length;
  // A date-only value is interpreted at midnight WIB, never in the device timezone.
  const activeDate = new Date(`${date}T00:00:00+07:00`);
  const dateOptions = { timeZone: 'Asia/Jakarta' };
  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    ...dateOptions, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const fullDate = dateFormatter.format(activeDate);
  const today = fullDate === dateFormatter.format(new Date());

  return (
    <AssistantScreen edges={['top', 'left', 'right']}>
      <AssistantHeader greeting="Selamat pagi, Nadia" title="Jadwal asisten" initials="NA" identityLabel="Nadia, asisten (identitas contoh)" />
      {feedback && !dismissed && <View style={styles.feedback}>
        <AssistantText tone="accent" accessibilityLiveRegion="polite" style={styles.feedbackText}>{feedback}</AssistantText>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup pesan" onPress={() => setDismissed(true)} style={styles.dismiss}>
          <AssistantText tone="accent">Tutup</AssistantText>
        </Pressable>
      </View>}
      <View style={styles.dayBanner}>
        <View style={styles.dateBlock}>
          <AssistantText style={styles.day}>{new Intl.DateTimeFormat('id-ID', { ...dateOptions, day: 'numeric' }).format(activeDate)}</AssistantText>
          <AssistantText style={styles.month}>{new Intl.DateTimeFormat('id-ID', { ...dateOptions, month: 'short' }).format(activeDate).toUpperCase()}</AssistantText>
        </View>
        <View style={styles.agenda}>
          <AssistantText style={styles.dateLabel}>{fullDate}</AssistantText>
          <AssistantText variant="caption" style={styles.white}>{daySessions.length} sesi{today ? ' hari ini' : ''} · {openCount} sedang dibuka</AssistantText>
        </View>
        <ScheduleIcon name="calendarWhite" size={21} />
      </View>
      <View style={styles.filters} accessibilityLabel="Filter status sesi">
        {filters.map(value => (
          <Pressable key={value} accessibilityRole="button"
            accessibilityState={{ selected: value === filter }}
            onPress={() => setFilter(value)}
            style={({ pressed }) => [styles.filter, value === filter && styles.selectedFilter, pressed && styles.pressed]}>
            <AssistantText variant="caption" style={[styles.filterLabel, value === filter && styles.white]} tone="secondary">
              {value === 'all' ? 'Semua' : statusLabels[value]}
            </AssistantText>
          </Pressable>
        ))}
      </View>
      <View style={styles.listHeading}>
        <AssistantText variant="sectionTitle" accessibilityRole="header">{today ? 'Sesi hari ini' : 'Sesi pada tanggal ini'}</AssistantText>
        <Pressable accessibilityRole="button" disabled={!onAdd} onPress={onAdd}
          accessibilityState={{ disabled: !onAdd }} accessibilityHint={!onAdd ? 'Penambahan sesi belum tersedia.' : undefined}
          style={[styles.add, !onAdd && styles.disabled]}>
          <ScheduleIcon name="plus" size={16} />
          <AssistantText tone="accent" style={styles.addText}>Tambah sesi</AssistantText>
        </Pressable>
      </View>
      <View style={styles.list} accessibilityLiveRegion="polite">
        {visible.map(session => <ScheduleCard key={session.id} session={session} attendance={attendance} onManage={onManage} />)}
        {visible.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><ScheduleIcon name="calendarPlus" size={34} /></View>
            <AssistantText style={styles.emptyTitle} accessibilityRole="header">
              {daySessions.length === 0 ? 'Jadwal masih kosong' : 'Tidak ada sesi untuk filter ini'}
            </AssistantText>
            {daySessions.length === 0 && (
              <AssistantText tone="secondary" style={styles.center}>
                Belum ada sesi praktikum yang dijadwalkan. Tambahkan sesi pertama untuk mulai mencatat presensi.
              </AssistantText>
            )}
            {daySessions.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => setFilter('all')} style={styles.reset}>
                <AssistantText variant="label" style={styles.white}>Tampilkan semua sesi</AssistantText>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" disabled={!onAdd} onPress={onAdd}
                accessibilityState={{ disabled: !onAdd }} style={[styles.reset, !onAdd && styles.disabled]}>
                <AssistantText variant="label" style={styles.white}>Tambah sesi pertama</AssistantText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </AssistantScreen>
  );
}

const styles = StyleSheet.create({
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: theme.colors.primarySoft, borderRadius: theme.radius.control },
  feedbackText: { flex: 1 },
  dismiss: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  dayBanner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16, minHeight: 88, backgroundColor: theme.colors.primary, borderRadius: theme.radius.card },
  dateBlock: { alignItems: 'center', minWidth: 42 },
  day: { fontSize: 32, lineHeight: 39, fontFamily: theme.fonts.bold, color: theme.colors.surface },
  month: { fontSize: 10, lineHeight: 14, fontFamily: theme.fonts.semibold, color: theme.colors.surface },
  agenda: { flex: 1, gap: 7 },
  dateLabel: { fontFamily: theme.fonts.semibold, fontSize: 15, lineHeight: 21, color: theme.colors.surface },
  white: { color: theme.colors.surface },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filter: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surface },
  selectedFilter: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterLabel: { fontFamily: theme.fonts.semibold },
  pressed: { opacity: 0.7 },
  listHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 },
  addText: { fontSize: 13, fontFamily: theme.fonts.semibold },
  disabled: { opacity: 0.5 },
  list: { gap: 14 },
  empty: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 32, gap: 16 },
  emptyIcon: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.panel, backgroundColor: theme.colors.primarySoft },
  emptyTitle: { fontFamily: theme.fonts.bold, fontSize: 20, lineHeight: 27, textAlign: 'center' },
  center: { textAlign: 'center' },
  reset: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.control, paddingHorizontal: 18, paddingVertical: 14, minHeight: 50, alignSelf: 'stretch', alignItems: 'center' },
});
