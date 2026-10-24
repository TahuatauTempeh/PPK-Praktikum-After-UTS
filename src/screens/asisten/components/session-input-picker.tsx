import { useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { previewDate } from '../schedule-data';
import { type SessionChoices } from '../session-form';
import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';

export type SessionPickerKind = 'course' | 'className' | 'date' | 'startTime' | 'endTime';
const titles: Record<SessionPickerKind, string> = {
  course: 'Pilih mata kuliah', className: 'Pilih kelas', date: 'Pilih tanggal',
  startTime: 'Jam mulai (WIB)', endTime: 'Jam selesai (WIB)',
};
const pad = (value: number) => String(value).padStart(2, '0');

type Props = { kind: SessionPickerKind; value: string; choices: SessionChoices; onPick: (value: string) => void; onCancel: () => void };
export function SessionInputPicker({ kind, value, choices, onPick, onCancel }: Props) {
  const time = kind === 'startTime' || kind === 'endTime';
  const [draft, setDraft] = useState(value || (kind === 'date' ? previewDate : kind === 'endTime' ? '09:40' : '08:00'));
  const [month, setMonth] = useState(() => new Date(`${(kind === 'date' && value ? value : previewDate).slice(0, 7)}-01T00:00:00Z`));
  const cancelRef = useRef<ComponentRef<typeof Pressable>>(null);
  const timeLists = useRef<(ComponentRef<typeof ScrollView> | null)[]>([]);
  const options = kind === 'course' ? choices.courses.map(name => ({ name, note: '' }))
    : choices.classes.map(item => ({ name: item.name, note: `${item.participantIds.length} praktikan terdaftar` }));
  const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = (month.getUTCDay() + 6) % 7;
  function changeMonth(amount: number) {
    const next = new Date(month);
    next.setUTCMonth(next.getUTCMonth() + amount, 1);
    setMonth(next);
  }
  const [hour, minute] = draft.split(':');

  return (
    <Modal visible transparent animationType="none" onRequestClose={onCancel} onShow={() => cancelRef.current?.focus()}>
      <SafeAreaView style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View role="dialog" accessibilityViewIsModal accessibilityLabel={titles[kind]} style={styles.dialog}>
            <AssistantText style={styles.title} accessibilityRole="header">{titles[kind]}</AssistantText>
            {kind === 'course' || kind === 'className' ? (
              <View style={styles.options} accessibilityRole="radiogroup">
                {options.map(option => <Pressable key={option.name} accessibilityRole="radio"
                  accessibilityState={{ checked: option.name === value }} onPress={() => onPick(option.name)}
                  style={({ pressed }) => [styles.option, option.name === value && styles.selected, pressed && styles.pressed]}>
                  <AssistantText variant="label">{option.name}</AssistantText>
                  {option.note !== '' && <AssistantText variant="caption" tone="secondary">{option.note}</AssistantText>}
                </Pressable>)}
                {options.length === 0 && <AssistantText tone="secondary">Belum ada pilihan tersedia.</AssistantText>}
              </View>
            ) : kind === 'date' ? (
              <>
                <View style={styles.monthHeader}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Bulan sebelumnya" onPress={() => changeMonth(-1)} style={styles.monthButton}>
                    <AssistantText variant="label" tone="accent">‹</AssistantText>
                  </Pressable>
                  <AssistantText variant="label" style={styles.monthLabel}>{new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(month)}</AssistantText>
                  <Pressable accessibilityRole="button" accessibilityLabel="Bulan berikutnya" onPress={() => changeMonth(1)} style={styles.monthButton}>
                    <AssistantText variant="label" tone="accent">›</AssistantText>
                  </Pressable>
                </View>
                <ScrollView horizontal contentContainerStyle={styles.calendarScroll}>
                  <View style={styles.calendar}>
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => <View key={day} style={styles.day}>
                      <AssistantText variant="caption" tone="secondary">{day}</AssistantText>
                    </View>)}
                    {Array.from({ length: offset }, (_, index) => <View key={`blank-${index}`} style={styles.day} />)}
                    {Array.from({ length: days }, (_, index) => {
                      const date = `${month.getUTCFullYear()}-${pad(month.getUTCMonth() + 1)}-${pad(index + 1)}`;
                      return <Pressable key={date} accessibilityRole="button" accessibilityLabel={new Intl.DateTimeFormat('id-ID', {
                        timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      }).format(new Date(`${date}T00:00:00Z`))} accessibilityState={{ selected: draft === date }}
                        onPress={() => setDraft(date)} style={[styles.day, draft === date && styles.selected]}>
                        <AssistantText tone={draft === date ? 'accent' : 'primary'}>{index + 1}</AssistantText>
                      </Pressable>;
                    })}
                  </View>
                </ScrollView>
                <AssistantText variant="caption" tone="secondary">Pilihan: {new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', dateStyle: 'full' }).format(new Date(`${draft}T00:00:00Z`))}</AssistantText>
              </>
            ) : time ? (
              <>
                <AssistantText variant="detailTitle" tone="accent" style={styles.timePreview}>{hour}.{minute} WIB</AssistantText>
                <View style={styles.timeColumns}>
                  {(['Jam', 'Menit'] as const).map((label, column) => (
                    <View key={label} style={styles.timeColumn}>
                      <AssistantText variant="caption" tone="secondary" style={styles.timePreview}>{label}</AssistantText>
                      <ScrollView style={styles.timeList} ref={node => { timeLists.current[column] = node; }}
                        onContentSizeChange={() => timeLists.current[column]?.scrollTo({ y: Number(column === 0 ? hour : minute) * 44, animated: false })}>
                        {Array.from({ length: column === 0 ? 24 : 60 }, (_, index) => {
                          const part = pad(index);
                          const selected = part === (column === 0 ? hour : minute);
                          return <Pressable key={part} accessibilityRole="button" accessibilityLabel={`${label} ${part}`}
                            accessibilityState={{ selected }} onPress={() => setDraft(column === 0 ? `${part}:${minute}` : `${hour}:${part}`)}
                            style={[styles.timeOption, selected && styles.selected]}>
                            <AssistantText tone={selected ? 'accent' : 'primary'}>{part}</AssistantText>
                          </Pressable>;
                        })}
                      </ScrollView>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
            {(kind === 'date' || time) && <Pressable accessibilityRole="button" onPress={() => onPick(draft)} style={[styles.button, styles.primary]}>
              <AssistantText variant="label" style={styles.white}>Gunakan {kind === 'date' ? 'tanggal' : 'waktu'}</AssistantText>
            </Pressable>}
            <Pressable ref={cancelRef} accessibilityRole="button" onPress={onCancel} style={styles.button}>
              <AssistantText variant="label" tone="accent">Batal</AssistantText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(18,23,44,0.5)' },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  dialog: { width: '100%', maxWidth: 440, padding: 16, gap: 16, borderRadius: 22, backgroundColor: theme.colors.surface },
  title: { fontSize: 23, lineHeight: 30, fontFamily: theme.fonts.bold },
  options: { gap: 10 },
  option: { padding: 12, gap: 5, minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.control },
  selected: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary, borderWidth: 1, borderRadius: theme.radius.control },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { flex: 1, textAlign: 'center' },
  calendarScroll: { flexGrow: 1, justifyContent: 'center' },
  calendar: { width: 308, flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  timePreview: { textAlign: 'center' },
  timeColumns: { flexDirection: 'row', gap: 16 },
  timeColumn: { flex: 1, gap: 8 },
  timeList: { height: 220, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.control },
  timeOption: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  button: { minHeight: 50, padding: 12, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.control, borderWidth: 1, borderColor: theme.colors.border },
  primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  white: { color: theme.colors.surface },
  pressed: { opacity: 0.7 },
});
