import { type ComponentRef, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type DateRange, isValidDate, monthRange } from '../recap-data';
import { type AssistantSession, previewDate } from '../schedule-data';
import { formatSessionDate } from '../session-format';
import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';

type Props = {
  kind: 'date' | 'session';
  range: DateRange | null;
  selectedId: string;
  sessions: readonly AssistantSession[];
  onRange: (range: DateRange | null) => void;
  onSelect: (id: string) => void;
  onCancel: () => void;
};
export function RecapFilterDialog({ kind, range, selectedId, sessions, onRange, onSelect, onCancel }: Props) {
  const defaults = range ?? monthRange(previewDate);
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});
  const cancelRef = useRef<ComponentRef<typeof Pressable>>(null);
  const title = kind === 'date' ? 'Rentang tanggal' : 'Pilih sesi';

  function applyRange() {
    const next: typeof errors = {};
    if (!isValidDate(start)) next.start = 'Gunakan tanggal valid dengan format YYYY-MM-DD.';
    if (!isValidDate(end)) next.end = 'Gunakan tanggal valid dengan format YYYY-MM-DD.';
    else if (!next.start && end < start) next.end = 'Tanggal akhir harus sama atau setelah tanggal awal.';
    setErrors(next);
    if (!next.start && !next.end) onRange({ start, end });
  }

  return (
    <Modal transparent visible animationType="none" onRequestClose={onCancel} onShow={() => cancelRef.current?.focus()}>
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View role="dialog" accessibilityViewIsModal accessibilityLabel={title} style={styles.dialog}>
              <AssistantText style={styles.title} accessibilityRole="header">{title}</AssistantText>
              {kind === 'date' ? (
                <>
                  <AssistantText variant="caption" tone="secondary">Tanggal sesi menggunakan WIB. Format: tahun-bulan-hari.</AssistantText>
                  <View style={styles.field}>
                    <AssistantText variant="caption" style={styles.bold}>Tanggal awal</AssistantText>
                    <TextInput accessibilityLabel="Tanggal awal" placeholder="YYYY-MM-DD" value={start}
                      autoCorrect={false} autoCapitalize="none" onChangeText={setStart}
                      style={[styles.input, errors.start && styles.invalid]} aria-invalid={Boolean(errors.start)} />
                    {errors.start && <AssistantText style={styles.error} accessibilityRole="alert">{errors.start}</AssistantText>}
                  </View>
                  <View style={styles.field}>
                    <AssistantText variant="caption" style={styles.bold}>Tanggal akhir</AssistantText>
                    <TextInput accessibilityLabel="Tanggal akhir" placeholder="YYYY-MM-DD" value={end}
                      autoCorrect={false} autoCapitalize="none" onChangeText={setEnd}
                      style={[styles.input, errors.end && styles.invalid]} aria-invalid={Boolean(errors.end)} />
                    {errors.end && <AssistantText style={styles.error} accessibilityRole="alert">{errors.end}</AssistantText>}
                  </View>
                  <Pressable accessibilityRole="button" onPress={applyRange} style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}>
                    <AssistantText variant="label" style={styles.white}>Terapkan tanggal</AssistantText>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => onRange(null)} style={styles.button}>
                    <AssistantText variant="label" tone="accent">Semua tanggal</AssistantText>
                  </Pressable>
                </>
              ) : (
                <View style={styles.options}>
                  <Pressable accessibilityRole="radio" accessibilityState={{ checked: selectedId === '' }}
                    onPress={() => onSelect('')} style={[styles.option, selectedId === '' && styles.selected]}>
                    <AssistantText variant="label">Semua sesi</AssistantText>
                  </Pressable>
                  {sessions.map(session => (
                    <Pressable key={session.id} accessibilityRole="radio" accessibilityState={{ checked: selectedId === session.id }}
                      onPress={() => onSelect(session.id)} style={[styles.option, selectedId === session.id && styles.selected]}>
                      <AssistantText style={styles.bold}>{session.course} · {session.className}</AssistantText>
                      <AssistantText variant="caption" tone="secondary">{session.topic}</AssistantText>
                      <AssistantText variant="caption" tone="secondary">{formatSessionDate(session.date)}</AssistantText>
                    </Pressable>
                  ))}
                </View>
              )}
              <Pressable ref={cancelRef} accessibilityRole="button" onPress={onCancel} style={styles.button}>
                <AssistantText variant="label" tone="accent">Batal</AssistantText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(18,23,44,0.5)' },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 440, backgroundColor: theme.colors.surface, borderRadius: 22, padding: 24, gap: 16 },
  title: { fontFamily: theme.fonts.bold, fontSize: 23, lineHeight: 30 },
  field: { gap: 7 },
  bold: { fontFamily: theme.fonts.semibold },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.control, minHeight: 48, padding: 12, fontSize: 16, color: theme.colors.textPrimary, fontFamily: theme.fonts.regular },
  invalid: { borderColor: theme.colors.error },
  error: { fontSize: 12, lineHeight: 18, color: theme.colors.error },
  button: { alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: 12, borderRadius: theme.radius.control, borderWidth: 1, borderColor: theme.colors.border },
  primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  white: { color: theme.colors.surface },
  options: { gap: 10 },
  option: { minHeight: 48, padding: 12, gap: 5, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.control },
  selected: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  pressed: { opacity: 0.7 },
});
