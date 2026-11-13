import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AgendaBanner } from './components/agenda-banner';
import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { AssistantTopBar } from './components/assistant-top-bar';
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
  onManage?: (id: string) => void;
  onBack?: () => void;
};

export default function ScheduleScreen({
  sessions = previewSessions, attendance = previewAttendance, date = previewDate,
  onManage, onBack,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const daySessions = sessions.filter(session => session.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const visible = daySessions.filter(session => filter === 'all' || session.status === filter);
  // A date-only value is interpreted at midnight WIB, never in the device timezone.
  const activeDate = new Date(`${date}T00:00:00+07:00`);
  const dateOptions = { timeZone: 'Asia/Jakarta' };
  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    ...dateOptions, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const fullDate = dateFormatter.format(activeDate);
  const today = fullDate === dateFormatter.format(new Date());

  return (
    <AssistantScreen
      header={onBack ? <AssistantTopBar onBack={onBack} title="Jadwal" /> : undefined}
      edges={['top', 'left', 'right']}
    >
      <AgendaBanner date={date} sessions={sessions} />
      <View style={styles.scheduleSection}>
        <View style={styles.listHeading}>
          <AssistantText style={styles.sectionTitle} accessibilityRole="header">{today ? 'Sesi hari ini' : 'Daftar sesi'}</AssistantText>
          <AssistantText variant="caption" tone="secondary">{visible.length} sesi</AssistantText>
        </View>
        <ScrollView horizontal style={styles.filterViewport} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} accessibilityLabel="Filter status sesi">
          {filters.map(value => {
            const count = value === 'all' ? daySessions.length : daySessions.filter(session => session.status === value).length;
            const selected = value === filter;
            return (
              <Pressable key={value} accessibilityRole="button"
                accessibilityLabel={`${value === 'all' ? 'Semua' : statusLabels[value]}, ${count} sesi`}
                accessibilityState={{ selected }}
                onPress={() => setFilter(value)}
                style={({ pressed }) => [styles.filter, selected && styles.selectedFilter, pressed && styles.pressed]}>
                <AssistantText style={[styles.filterLabel, selected && styles.white]} tone="secondary">
                  {value === 'all' ? 'Semua' : statusLabels[value]}
                </AssistantText>
                <AssistantText style={[styles.filterCount, selected && styles.selectedCount]}>{count}</AssistantText>
              </Pressable>
            );
          })}
        </ScrollView>
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
                Belum ada sesi praktikum yang dijadwalkan.
              </AssistantText>
            )}
            {daySessions.length > 0 && (
              <Pressable accessibilityRole="button" onPress={() => setFilter('all')} style={styles.reset}>
                <AssistantText variant="label" style={styles.white}>Tampilkan semua sesi</AssistantText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </AssistantScreen>
  );
}

const styles = StyleSheet.create({
  white: { color: theme.colors.surface },
  scheduleSection: { gap: 14, marginTop: 8 },
  filterViewport: { marginHorizontal: -theme.spacing.page },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: theme.spacing.page, paddingBottom: 2 },
  filter: { minHeight: 44, paddingHorizontal: 13, gap: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', borderRadius: theme.radius.pill, backgroundColor: 'rgba(255,255,255,0.6)' },
  selectedFilter: { backgroundColor: '#204CAC', borderColor: '#204CAC' },
  filterLabel: { fontSize: 12, lineHeight: 18, fontFamily: theme.fonts.semibold },
  filterCount: { fontSize: 10, lineHeight: 16, fontFamily: theme.fonts.semibold, color: theme.colors.textSecondary },
  selectedCount: { color: '#D5E3FF' },
  pressed: { opacity: 0.7 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, lineHeight: 27, fontFamily: theme.fonts.bold, letterSpacing: -0.4 },
  list: { gap: 14 },
  empty: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 32, gap: 16 },
  emptyIcon: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.panel, backgroundColor: 'rgba(255,255,255,0.65)' },
  emptyTitle: { fontFamily: theme.fonts.bold, fontSize: 20, lineHeight: 27, textAlign: 'center' },
  center: { textAlign: 'center' },
  reset: { backgroundColor: '#204CAC', borderRadius: theme.radius.control, paddingHorizontal: 18, paddingVertical: 14, minHeight: 50, alignSelf: 'stretch', alignItems: 'center' },
});
