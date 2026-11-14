import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { type PracticumClass } from '@/types';

import { AssistantSheet } from '../components/assistant-sheet';
import { AssistantText } from '../components/assistant-text';
import { ScheduleIcon } from '../components/schedule-icon';
import { assistantTheme as theme } from '../theme';

type Props = {
  initialClass: PracticumClass | null;
  onCancel: () => void;
  onSubmit: (values: { name: string; description: string }) => Promise<void>;
};

/** Bottom sheet untuk menambah atau mengubah data kelas praktikum. */
export function ClassFormSheet({ initialClass, onCancel, onSubmit }: Props) {
  const isEditing = initialClass !== null;
  const [name, setName] = useState(initialClass?.name ?? '');
  const [description, setDescription] = useState(initialClass?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const title = isEditing ? 'Edit Kelas' : 'Tambah Kelas Baru';

  async function handleSave(closeSheet: (action?: () => void) => void) {
    if (submitting) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama kelas wajib diisi.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name: trimmedName, description: description.trim() });
      closeSheet(onCancel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kelas.');
      setSubmitting(false);
    }
  }

  return (
    <AssistantSheet onCancel={onCancel} onShow={() => {}}>
      {closeSheet => (
        <View style={styles.dialog} role="dialog" accessibilityViewIsModal accessibilityLabel={title}>
          <View style={styles.header}>
            <View style={styles.icon}>
              <ScheduleIcon name="calendarPlus" size={22} />
            </View>
            <View style={styles.heading}>
              <AssistantText style={styles.title} accessibilityRole="header">{title}</AssistantText>
              <AssistantText variant="caption" tone="secondary">
                {isEditing
                  ? 'Perbarui nama atau deskripsi kelas praktikum.'
                  : 'Buat kelas baru untuk mengelompokkan peserta dan sesi.'}
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
              <AssistantText variant="label" style={styles.fieldLabel}>Nama Kelas *</AssistantText>
              <TextInput
                value={name}
                onChangeText={value => {
                  setName(value);
                  if (error) setError(null);
                }}
                placeholder="Contoh: Basis Data C2"
                placeholderTextColor={theme.colors.textSecondary}
                editable={!submitting}
                maxLength={80}
                style={[styles.input, error && !name.trim() && styles.inputError]}
                accessibilityLabel="Nama Kelas"
              />
            </View>

            <View style={styles.field}>
              <AssistantText variant="label" style={styles.fieldLabel}>Deskripsi</AssistantText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ringkasan materi atau catatan kelas (opsional)"
                placeholderTextColor={theme.colors.textSecondary}
                editable={!submitting}
                multiline
                numberOfLines={3}
                maxLength={240}
                textAlignVertical="top"
                style={[styles.input, styles.textarea]}
                accessibilityLabel="Deskripsi Kelas"
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
                {submitting ? 'Menyimpan...' : isEditing ? 'Simpan perubahan' : 'Tambah kelas'}
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

const styles = StyleSheet.create({
  dialog: { width: '100%', padding: 24, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { flex: 1, gap: 4 },
  title: { fontSize: 21, lineHeight: 28, fontFamily: theme.fonts.bold },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.errorSoft,
    borderWidth: 1,
    borderColor: '#F3C7CD',
  },
  errorText: { flex: 1, color: theme.colors.error, fontFamily: theme.fonts.medium },
  fields: { gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, lineHeight: 18 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  inputError: { borderColor: theme.colors.error },
  textarea: { minHeight: 88, paddingTop: 12 },
  actions: { gap: 10, marginTop: 4 },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.control,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  cancel: { backgroundColor: theme.colors.glassSurface, borderColor: theme.colors.glassBorder },
  disabled: { opacity: 0.6 },
  white: { color: theme.colors.surface },
  pressed: { opacity: 0.7 },
});
