import { type ComponentRef, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AssistantSheet, type CloseSheet } from './assistant-sheet';

import { tanggalHariIniWIB } from '../jadwal-aktif';
import { type DateRange, isValidDate, monthRange } from '../recap-data';
import { type AssistantSession } from '../schedule-data';
import { formatPraktikumName, formatSessionDate } from '../session-format';
import {
  tokens,
  useThemedStyles,
  type Theme,
} from '@/theme';
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
  const styles = useThemedStyles(gaya);
  const defaults = range ?? monthRange(tanggalHariIniWIB());
  const [start, setStart] = useState(defaults.start);
  const [end, setEnd] = useState(defaults.end);
  const [errors, setErrors] = useState<{ start?: string; end?: string }>({});
  const cancelRef = useRef<ComponentRef<typeof Pressable>>(null);
  const title = kind === 'date' ? 'Rentang tanggal' : 'Pilih sesi';

  function applyRange(close: CloseSheet) {
    const next: typeof errors = {};
    if (!isValidDate(start)) next.start = 'Gunakan tanggal valid dengan format YYYY-MM-DD.';
    if (!isValidDate(end)) next.end = 'Gunakan tanggal valid dengan format YYYY-MM-DD.';
    else if (!next.start && end < start) next.end = 'Tanggal akhir harus sama atau setelah tanggal awal.';
    setErrors(next);
    if (!next.start && !next.end) close(() => onRange({ start, end }));
  }

  return (
    <AssistantSheet onCancel={onCancel} onShow={() => cancelRef.current?.focus()}>
      {closeSheet => (
        <View role="dialog" accessibilityViewIsModal accessibilityLabel={title} style={styles.dialog}>
          <AssistantText style={styles.title} accessibilityRole="header">{title}</AssistantText>
          {kind === 'date' ? (
            <>
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
              <Pressable accessibilityRole="button" onPress={() => applyRange(closeSheet)} style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}>
                <AssistantText variant="label" style={styles.white}>Terapkan tanggal</AssistantText>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => closeSheet(() => onRange(null))} style={styles.button}>
                <AssistantText variant="label" tone="accent">Semua tanggal</AssistantText>
              </Pressable>
            </>
          ) : (
            <View style={styles.options}>
              <Pressable accessibilityRole="radio" accessibilityState={{ checked: selectedId === '' }}
                onPress={() => closeSheet(() => onSelect(''))} style={[styles.option, selectedId === '' && styles.selected]}>
                <AssistantText variant="label">Semua sesi</AssistantText>
              </Pressable>
              {sessions.map(session => (
                <Pressable key={session.id} accessibilityRole="radio" accessibilityState={{ checked: selectedId === session.id }}
                  onPress={() => closeSheet(() => onSelect(session.id))} style={[styles.option, selectedId === session.id && styles.selected]}>
                  <AssistantText style={styles.bold}>{formatPraktikumName(session)}</AssistantText>
                  <AssistantText variant="caption" tone="secondary">{session.topic}</AssistantText>
                  <AssistantText variant="caption" tone="secondary">{formatSessionDate(session.date)}</AssistantText>
                </Pressable>
              ))}
            </View>
          )}
          <Pressable ref={cancelRef} accessibilityRole="button" onPress={() => closeSheet(onCancel)} style={styles.button}>
            <AssistantText variant="label" tone="accent">Batal</AssistantText>
          </Pressable>
        </View>
      )}
    </AssistantSheet>
  );
}
const gaya = (theme: Theme) => StyleSheet.create({
  dialog: { width: '100%', backgroundColor: 'transparent', padding: 24, gap: 16 },
  title: { fontFamily: tokens.fonts.bold, fontSize: 23, lineHeight: 30 },
  field: { gap: 7 },
  bold: { fontFamily: tokens.fonts.semibold },
  input: { backgroundColor: theme.colors.glassSurface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: tokens.radius.control, minHeight: 48, padding: 12, fontSize: 16, color: theme.colors.textPrimary, fontFamily: tokens.fonts.regular },
  invalid: { borderColor: theme.colors.error },
  error: { fontSize: 12, lineHeight: 18, color: theme.colors.error },
  button: { backgroundColor: theme.colors.glassSurface, alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: 12, borderRadius: tokens.radius.control, borderWidth: 1, borderColor: theme.colors.border },
  primary: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
  white: { color: theme.colors.onPrimary },
  options: { gap: 10 },
  option: { minHeight: 48, padding: 16, backgroundColor: theme.colors.glassSurface, gap: 5, justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: tokens.radius.control },
  selected: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  pressed: { opacity: 0.7 },
});
