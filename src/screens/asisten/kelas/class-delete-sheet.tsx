import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { type PracticumClass } from '@/types';

import { AssistantSheet } from '../components/assistant-sheet';
import { AssistantText } from '../components/assistant-text';
import { ScheduleIcon } from '../components/schedule-icon';
import { assistantTheme as theme } from '../theme';

type Props = {
  targetClass: PracticumClass;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

/** Bottom sheet konfirmasi sebelum menghapus kelas praktikum. */
export function ClassDeleteSheet({ targetClass, onCancel, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(closeSheet: (action?: () => void) => void) {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      closeSheet(onCancel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kelas.');
      setDeleting(false);
    }
  }

  return (
    <AssistantSheet onCancel={onCancel} onShow={() => {}}>
      {closeSheet => (
        <View style={styles.dialog} role="dialog" accessibilityViewIsModal accessibilityLabel="Hapus kelas">
          <View style={styles.icon}>
            <ScheduleIcon name="lockDanger" size={24} />
          </View>

          <View style={styles.message}>
            <AssistantText style={styles.title} accessibilityRole="header">Hapus kelas ini?</AssistantText>
            <AssistantText tone="secondary">
              Kelas yang dihapus tidak dapat dipulihkan. Pastikan tidak ada sesi aktif di dalamnya.
            </AssistantText>
          </View>

          <View style={styles.summary}>
            <AssistantText style={styles.className}>{targetClass.name}</AssistantText>
            <AssistantText variant="caption" tone="secondary">
              {targetClass.description || 'Belum ada deskripsi.'}
            </AssistantText>
          </View>

          {error && (
            <AssistantText variant="caption" style={styles.errorText}>{error}</AssistantText>
          )}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={deleting}
              onPress={() => void handleConfirm(closeSheet)}
              style={({ pressed }) => [
                styles.button,
                styles.danger,
                deleting && styles.disabled,
                pressed && !deleting && styles.pressed,
              ]}>
              <AssistantText variant="label" style={styles.white}>
                {deleting ? 'Menghapus...' : 'Ya, hapus kelas'}
              </AssistantText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={deleting}
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
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { gap: 8 },
  title: { fontSize: 22, lineHeight: 29, fontFamily: theme.fonts.bold },
  summary: {
    padding: 14,
    gap: 6,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.control,
  },
  className: { fontFamily: theme.fonts.semibold },
  errorText: { color: theme.colors.error, fontFamily: theme.fonts.medium },
  actions: { gap: 10 },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.control,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  danger: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
  cancel: { backgroundColor: theme.colors.glassSurface, borderColor: theme.colors.glassBorder },
  disabled: { opacity: 0.6 },
  white: { color: theme.colors.surface },
  pressed: { opacity: 0.7 },
});
