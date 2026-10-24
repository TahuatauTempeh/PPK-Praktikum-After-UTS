import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AssistantNavigation } from './components/assistant-navigation';
import { AssistantScreen } from './components/assistant-screen';
import { AssistantText } from './components/assistant-text';
import { RecapCard } from './components/recap-card';
import { RecapFilterDialog } from './components/recap-filter-dialog';
import { ScheduleIcon } from './components/schedule-icon';
import { useAssistantSessions } from './preview-session-provider';
import { buildRecap, type DateRange, monthRange } from './recap-data';
import { previewDate } from './schedule-data';
import { formatSessionDate } from './session-format';
import { assistantTheme as theme } from './theme';

type Props = { initialSessionId?: string; onSchedule: () => void; onDetail: (id: string) => void };
export default function RecapScreen({ initialSessionId = '', onSchedule, onDetail }: Props) {
  const { sessions, attendance, participants } = useAssistantSessions();
  const initialSession = sessions.find(session => session.id === initialSessionId);
  const [range, setRange] = useState<DateRange | null>(() => monthRange(initialSession?.date ?? previewDate));
  const [selectedId, setSelectedId] = useState(initialSessionId);
  const [expandedId, setExpandedId] = useState(initialSessionId);
  const [dialog, setDialog] = useState<'date' | 'session' | null>(null);
  const { rows, present, percent } = buildRecap(sessions, attendance, range, selectedId);
  const closedSessions = sessions.filter(session => session.status === 'closed')
    .sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`));
  const expanded = rows.find(row => row.session.id === expandedId)?.session.id ?? rows[0]?.session.id;
  const selected = sessions.find(session => session.id === selectedId);
  const dateLabel = range ? `${formatSessionDate(range.start)}–${formatSessionDate(range.end)}` : 'Semua tanggal';
  const sessionLabel = selected ? selected.topic : selectedId ? 'Sesi tidak tersedia' : 'Semua sesi';

  return (
    <>
      <View style={styles.screen} aria-hidden={dialog !== null} importantForAccessibility={dialog ? 'no-hide-descendants' : 'auto'}>
        <AssistantScreen footer={<AssistantNavigation active="recap" onSchedule={onSchedule} />}>
          <View style={styles.heading}>
            <AssistantText variant="pageTitle" accessibilityRole="header" style={styles.title}>Rekap presensi</AssistantText>
            <AssistantText variant="greeting" tone="secondary" style={styles.description}>Ringkasan kehadiran sesi yang telah ditutup.</AssistantText>
          </View>
          <View style={styles.filters}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Filter tanggal: ${dateLabel}`}
              accessibilityState={{ expanded: dialog === 'date' }} onPress={() => setDialog('date')}
              style={({ pressed }) => [styles.filter, styles.dateFilter, pressed && styles.pressed]}>
              <ScheduleIcon name="filterCalendar" size={16} />
              <AssistantText variant="caption" style={styles.filterText}>{range && range.start.slice(0, 7) === range.end.slice(0, 7)
                ? `${Number(range.start.slice(8))}–${formatSessionDate(range.end)}` : dateLabel}</AssistantText>
              <ScheduleIcon name="chevron" size={14} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Filter sesi: ${sessionLabel}`}
              accessibilityState={{ expanded: dialog === 'session' }} onPress={() => setDialog('session')}
              style={({ pressed }) => [styles.filter, pressed && styles.pressed]}>
              <AssistantText variant="caption" style={styles.filterText}>{sessionLabel}</AssistantText>
              <ScheduleIcon name="chevron" size={14} />
            </Pressable>
          </View>
          <View style={styles.metrics} accessibilityLiveRegion="polite">
            {[{ label: 'Sesi ditutup', value: rows.length }, { label: 'Total hadir', value: present },
              { label: 'Kehadiran', value: percent === null ? '—' : `${percent}%` }].map(metric => (
                <View style={styles.metric} key={metric.label}>
                  <AssistantText tone="accent" style={styles.metricNumber}>{metric.value}</AssistantText>
                  <AssistantText variant="caption" tone="secondary" style={styles.small}>{metric.label}</AssistantText>
                </View>
              ))}
          </View>
          {rows.length ? (
            <View style={styles.list}>
              <View style={styles.listHeading}>
                <AssistantText variant="sectionTitle" accessibilityRole="header">Hasil per sesi</AssistantText>
                <AssistantText variant="caption" tone="secondary" style={styles.small}>Terbaru lebih dulu</AssistantText>
              </View>
              {rows.map(row => <RecapCard key={row.session.id} row={row} attendance={attendance} participants={participants}
                expanded={row.session.id === expanded} onExpand={() => setExpandedId(row.session.id)} onDetail={() => onDetail(row.session.id)} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><ScheduleIcon name="chartEmpty" size={34} /></View>
              <AssistantText accessibilityRole="header" style={styles.emptyTitle}>{closedSessions.length ? 'Tidak ada rekap untuk filter ini' : 'Belum ada rekap'}</AssistantText>
              <AssistantText tone="secondary" style={styles.center}>{closedSessions.length
                ? 'Tidak ada sesi ditutup yang cocok dengan tanggal dan sesi pilihan. Ubah filter untuk melihat rekap lainnya.'
                : 'Rekap tersedia setelah sesi ditutup. Buka jadwal untuk mengelola sesi praktikum Anda.'}</AssistantText>
              {closedSessions.length > 0 && <Pressable accessibilityRole="button" onPress={() => { setRange(null); setSelectedId(''); }} style={styles.reset}>
                <AssistantText variant="label" tone="accent">Reset filter</AssistantText>
              </Pressable>}
              <Pressable accessibilityRole="button" onPress={onSchedule} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <ScheduleIcon name="calendarButton" size={18} />
                <AssistantText variant="label" style={styles.white}>Kembali ke jadwal</AssistantText>
              </Pressable>
            </View>
          )}
          <AssistantText variant="caption" tone="secondary">Data contoh · perubahan sementara akan direset saat aplikasi dimuat ulang.</AssistantText>
        </AssistantScreen>
      </View>
      {dialog && <RecapFilterDialog kind={dialog} range={range} selectedId={selectedId} sessions={closedSessions}
        onRange={next => { setRange(next); setDialog(null); }}
        onSelect={next => { setSelectedId(next); setExpandedId(next); setDialog(null); }} onCancel={() => setDialog(null)} />}
    </>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  heading: { gap: 8 },
  title: { fontSize: 28, lineHeight: 35 },
  description: { lineHeight: 20 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filter: { flexGrow: 1, flexBasis: 140, flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, paddingHorizontal: 11, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.control, backgroundColor: theme.colors.surface },
  dateFilter: { flexBasis: 185 },
  filterText: { flex: 1 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metric: { flex: 1, minWidth: 78, gap: 7, padding: 13, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface },
  metricNumber: { fontSize: 25, lineHeight: 32, fontFamily: theme.fonts.bold },
  small: { fontSize: 11, lineHeight: 16 },
  list: { gap: 13 },
  listHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 32 },
  emptyIcon: { width: 84, height: 84, borderRadius: theme.radius.panel, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: theme.fonts.bold, fontSize: 20, lineHeight: 27, textAlign: 'center' },
  center: { textAlign: 'center', paddingHorizontal: 22 },
  reset: { alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: 12 },
  primary: { alignSelf: 'stretch', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', minHeight: 50, paddingHorizontal: 18, paddingVertical: 14, backgroundColor: theme.colors.primary, borderRadius: theme.radius.control },
  white: { color: theme.colors.surface },
  pressed: { opacity: 0.7 },
});
