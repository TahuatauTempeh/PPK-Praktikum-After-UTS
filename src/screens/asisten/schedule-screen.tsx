import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
  onManage?: (id: string) => void;
};

export default function ScheduleScreen({
  sessions = previewSessions, attendance = previewAttendance, date = previewDate,
  onManage,
}: Props) {
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
      <View style={styles.dayBanner}>
        <View pointerEvents="none" accessible={false} style={styles.calendarWatermark}>
          <ScheduleIcon name="calendarWhite" size={126} />
        </View>
        <View style={styles.bannerHeading}>
          <AssistantText style={styles.bannerEyebrow}>AGENDA PRAKTIKUM</AssistantText>
        </View>
        <View style={styles.dateRow} accessibilityLabel={fullDate}>
          <AssistantText style={styles.day}>{new Intl.DateTimeFormat('id-ID', { ...dateOptions, day: '2-digit' }).format(activeDate)}</AssistantText>
          <View style={styles.dateDetails}>
            <AssistantText style={styles.weekday}>{new Intl.DateTimeFormat('id-ID', { ...dateOptions, weekday: 'long' }).format(activeDate)}</AssistantText>
            <AssistantText style={styles.month}>{new Intl.DateTimeFormat('id-ID', { ...dateOptions, month: 'long', year: 'numeric' }).format(activeDate)}</AssistantText>
          </View>
          {today && <View style={styles.todayBadge}><AssistantText style={styles.todayLabel}>Hari ini</AssistantText></View>}
        </View>
        <View style={styles.bannerFooter}>
          <AssistantText style={styles.sessionSummary}>{daySessions.length} sesi terjadwal</AssistantText>
          <View style={styles.openSummary}>
            <View style={styles.liveDot} />
            <AssistantText style={styles.openLabel}>{openCount} dibuka</AssistantText>
          </View>
        </View>
      </View>
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
  dayBanner: { overflow: 'hidden', padding: 22, gap: 18, backgroundColor: theme.colors.glassHero, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 30 },
  bannerHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  bannerEyebrow: { fontSize: 10, lineHeight: 16, letterSpacing: 1.8, fontFamily: theme.fonts.semibold, color: '#EDF3FF' },
  calendarWatermark: { position: 'absolute', top: -12, right: -16, opacity: 0.12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  day: { fontSize: 58, lineHeight: 64, letterSpacing: -3, fontFamily: theme.fonts.bold, color: theme.colors.surface, fontVariant: ['tabular-nums'] },
  dateDetails: { gap: 3, flex: 1, minWidth: 100 },
  weekday: { fontSize: 21, lineHeight: 28, fontFamily: theme.fonts.semibold, color: theme.colors.surface },
  month: { fontSize: 13, lineHeight: 20, color: '#EDF3FF' },
  todayBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: theme.radius.pill },
  todayLabel: { color: theme.colors.surface, fontSize: 11, lineHeight: 16, fontFamily: theme.fonts.semibold },
  bannerFooter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  sessionSummary: { fontSize: 12, lineHeight: 18, fontFamily: theme.fonts.medium, color: theme.colors.surface },
  openSummary: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DDF59A' },
  openLabel: { fontSize: 12, lineHeight: 18, color: '#FFFFFF' },
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
