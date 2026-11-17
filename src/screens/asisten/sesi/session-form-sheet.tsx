import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import {
  parseDateInput,
  requireNonEmpty,
  toDateInputValue,
  validateTimeRange,
} from '@/lib/praktikum-helpers';
import { tokens, useTheme, useThemedStyles, type Theme } from '@/theme';
import { type PracticumClass, type PraktikumSession } from '@/types';

import { AssistantSheet } from '../components/assistant-sheet';
import { AssistantText } from '../components/assistant-text';
import { ScheduleIcon } from '../components/schedule-icon';

export type SessionFormValues = {
  classId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
};

type Props = {
  classes: readonly PracticumClass[];
  initialClassId?: string | null;
  initialSession: PraktikumSession | null;
  onCancel: () => void;
  onSubmit: (values: SessionFormValues) => Promise<void>;
};

/** Bottom sheet untuk membuat atau mengubah jadwal sesi praktikum. */
export function SessionFormSheet({
  classes,
  initialClassId,
  initialSession,
  onCancel,
  onSubmit,
}: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const isEditing = initialSession !== null;
  const defaultClassId =
    initialSession?.classId ??
    (initialClassId && classes.some(c => c.id === initialClassId) ? initialClassId : classes[0]?.id ?? '');

  const [classId, setClassId] = useState(defaultClassId);
  const [title, setTitle] = useState(initialSession?.title ?? '');
  const [date, setDate] = useState(
    initialSession ? toDateInputValue(initialSession.date) : toDateInputValue(new Date())
  );
  const [startTime, setStartTime] = useState(initialSession?.startTime ?? '08:00');
  const [endTime, setEndTime] = useState(initialSession?.endTime ?? '10:00');
  const [room, setRoom] = useState(initialSession?.room ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const heading = isEditing ? 'Edit Sesi Praktikum' : 'Tambah Sesi Baru';

  async function handleSave(closeSheet: (action?: () => void) => void) {
    if (submitting) return;
    setError(null);

    try {
      const cleanClassId = requireNonEmpty(classId, 'Kelas');
      const cleanTitle = requireNonEmpty(title, 'Judul sesi');
      const isoDate = parseDateInput(date);
      const times = validateTimeRange(startTime, endTime);
      const cleanRoom = requireNonEmpty(room, 'Ruangan');

      setSubmitting(true);
      await onSubmit({
        classId: cleanClassId,
        title: cleanTitle,
        date: isoDate,
        startTime: times.startTime,
        endTime: times.endTime,
        room: cleanRoom,
      });
      closeSheet(onCancel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan sesi.');
      setSubmitting(false);
    }
  }

  return (
    <AssistantSheet onCancel={onCancel} onShow={() => {}}>
      {closeSheet => (
        <View style={styles.dialog} role="dialog" accessibilityViewIsModal accessibilityLabel={heading}>
          <View style={styles.header}>
            <View style={styles.icon}>
              <ScheduleIcon name="calendarPlus" size={22} tintColor={theme.colors.primary} />
            </View>
            <View style={styles.headingBlock}>
              <AssistantText style={styles.title} accessibilityRole="header">{heading}</AssistantText>
              <AssistantText variant="caption" tone="secondary">
                {isEditing
                  ? 'Perbarui kelas, topik, tanggal, jam, atau ruang sesi.'
                  : 'Sesi baru otomatis berstatus Dijadwalkan (scheduled).'}
              </AssistantText>
            </View>
          </View>

          {error && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <ScheduleIcon name="formError" size={16} />
              <AssistantText variant="caption" style={styles.errorText}>{error}</AssistantText>
            </View>
          )}

          <View style={styles.fields}>
            <View style={styles.field}>
              <AssistantText variant="label" style={styles.fieldLabel}>Kelas *</AssistantText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.classChips}>
                {classes.map(item => {
                  const selected = item.id === classId;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={submitting}
                      onPress={() => {
                        setClassId(item.id);
                        if (error) setError(null);
                      }}
                      style={({ pressed }) => [
                        styles.classChip,
                        selected && styles.classChipActive,
                        pressed && styles.pressed,
                      ]}>
                      <AssistantText style={[styles.classChipText, selected && styles.white]}>
                        {item.name}
                      </AssistantText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <AssistantText variant="label" style={styles.fieldLabel}>Judul / Topik Sesi *</AssistantText>
              <TextInput
                value={title}
                onChangeText={value => {
                  setTitle(value);
                  if (error) setError(null);
                }}
                placeholder="Contoh: Pertemuan 3: JOIN & Subquery"
                placeholderTextColor={theme.colors.textSecondary}
                editable={!submitting}
                maxLength={100}
                style={styles.input}
                accessibilityLabel="Judul Sesi"
              />
            </View>

            <View style={styles.field}>
              <AssistantText variant="label" style={styles.fieldLabel}>Tanggal (YYYY-MM-DD) *</AssistantText>
              <TextInput
                value={date}
                onChangeText={value => {
                  setDate(value);
                  if (error) setError(null);
                }}
                placeholder="2026-11-20"
                placeholderTextColor={theme.colors.textSecondary}
                editable={!submitting}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
                style={styles.input}
                accessibilityLabel="Tanggal Sesi"
              />
            </View>

            <View style={styles.timeRow}>
              <View style={[styles.field, styles.timeField]}>
                <AssistantText variant="label" style={styles.fieldLabel}>Jam Mulai *</AssistantText>
                <TextInput
                  value={startTime}
                  onChangeText={value => {
                    setStartTime(value);
                    if (error) setError(null);
                  }}
                  placeholder="08:00"
                  placeholderTextColor={theme.colors.textSecondary}
                  editable={!submitting}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                  style={styles.input}
                  accessibilityLabel="Jam Mulai"
                />
              </View>

              <View style={[styles.field, styles.timeField]}>
                <AssistantText variant="label" style={styles.fieldLabel}>Jam Selesai *</AssistantText>
                <TextInput
                  value={endTime}
                  onChangeText={value => {
                    setEndTime(value);
                    if (error) setError(null);
                  }}
                  placeholder="10:00"
                  placeholderTextColor={theme.colors.textSecondary}
                  editable={!submitting}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                  style={styles.input}
                  accessibilityLabel="Jam Selesai"
                />
              </View>
            </View>

            <View style={styles.field}>
              <AssistantText variant="label" style={styles.fieldLabel}>Ruangan *</AssistantText>
              <TextInput
                value={room}
                onChangeText={value => {
                  setRoom(value);
                  if (error) setError(null);
                }}
                placeholder="Contoh: Lab Komputer A"
                placeholderTextColor={theme.colors.textSecondary}
                editable={!submitting}
                maxLength={60}
                style={styles.input}
                accessibilityLabel="Ruangan"
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => void handleSave(closeSheet)}
              style={({ pressed }) => [
                styles.button,
                styles.primary,
                submitting && styles.disabled,
                pressed && !submitting && styles.pressed,
              ]}>
              <AssistantText variant="label" style={styles.white}>
                {submitting ? 'Menyimpan...' : isEditing ? 'Simpan perubahan' : 'Buat sesi'}
              </AssistantText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => closeSheet(onCancel)}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}>
              <AssistantText variant="label" tone="accent">Batal</AssistantText>
            </Pressable>
          </View>
        </View>
      )}
    </AssistantSheet>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  dialog: { width: '100%', padding: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingBlock: { flex: 1, gap: 3 },
  title: { fontSize: 21, lineHeight: 28, fontFamily: tokens.fonts.bold },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.errorSoft,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: { flex: 1, color: theme.colors.error, fontFamily: tokens.fonts.medium },
  fields: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, lineHeight: 18 },
  classChips: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  classChip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classChipActive: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
  classChipText: { fontSize: 13, fontFamily: tokens.fonts.semibold, color: theme.colors.textSecondary },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeField: { flex: 1 },
  input: {
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: tokens.fonts.regular,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  actions: { gap: 10, marginTop: 4 },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.control,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primary: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
  cancel: { backgroundColor: theme.colors.glassSurface, borderColor: theme.colors.glassBorder },
  disabled: { opacity: 0.6 },
  white: { color: theme.colors.onPrimary },
  pressed: { opacity: 0.7 },
});
