import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { tokens, useThemedStyles, useTheme, type Theme } from '@/theme';

import { AssistantSheet } from '../components/assistant-sheet';
import { AssistantText } from '../components/assistant-text';
import { ScheduleIcon } from '../components/schedule-icon';

type Props = {
  decision: 'approved' | 'rejected';
  name: string;
  sessionName: string;
  note: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Konfirmasi terima/tolak izin. Pola dan ukurannya sama dengan konfirmasi role di halaman admin. */
export function ReviewConfirmation({ decision, name, sessionName, note, onCancel, onConfirm }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(gaya);
  const cancelRef = useRef<ComponentRef<typeof Pressable>>(null);
  const approve = decision === 'approved';
  const title = approve ? 'Terima izin?' : 'Tolak izin?';

  return (
    <AssistantSheet onCancel={onCancel} onShow={() => cancelRef.current?.focus()}>
      {closeSheet => (
        <View role="dialog" accessibilityViewIsModal accessibilityLabel={title} style={styles.dialog}>
          <View style={[styles.icon, approve ? styles.approveIcon : styles.rejectIcon]}>
            <ScheduleIcon name={approve ? 'check' : 'formError'} size={24}
              tintColor={approve ? theme.colors.success : theme.colors.error} />
          </View>

          <View style={styles.message}>
            <AssistantText style={styles.title} accessibilityRole="header">
              {title}
            </AssistantText>
            <AssistantText tone="secondary">
              {approve
                ? `${name} tercatat izin untuk sesi ini. Keputusan tidak bisa diubah setelah disimpan.`
                : `Izin ${name} ditolak. Keputusan tidak bisa diubah setelah disimpan.`}
            </AssistantText>
          </View>

          <View style={styles.target}>
            <AssistantText style={styles.targetName}>{name}</AssistantText>
            <AssistantText variant="caption" tone="secondary">
              {sessionName}
            </AssistantText>
            <AssistantText variant="caption" tone="secondary">
              {note.trim() ? `Catatan: ${note.trim()}` : 'Tanpa catatan'}
            </AssistantText>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={approve ? `Terima izin ${name}` : `Tolak izin ${name}`}
              onPress={() => closeSheet(onConfirm)}
              style={({ pressed }) => [styles.button, approve ? styles.primary : styles.danger, pressed && styles.pressed]}
            >
              <AssistantText variant="label" style={approve ? styles.onPrimary : styles.onError}>
                {approve ? 'Ya, terima izin' : 'Ya, tolak izin'}
              </AssistantText>
            </Pressable>

            <Pressable
              ref={cancelRef}
              accessibilityRole="button"
              accessibilityLabel="Batal"
              onPress={() => closeSheet(onCancel)}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
            >
              <AssistantText variant="label" tone="accent">
                Batal
              </AssistantText>
            </Pressable>
          </View>
        </View>
      )}
    </AssistantSheet>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  dialog: { width: '100%', backgroundColor: 'transparent', padding: 24, gap: 20 },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  approveIcon: { backgroundColor: theme.colors.successSoft },
  rejectIcon: { backgroundColor: theme.colors.errorSoft },
  message: { gap: 9 },
  title: { fontSize: 23, lineHeight: 30, fontFamily: tokens.fonts.bold },
  target: {
    gap: 7,
    padding: 14,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: tokens.radius.control,
  },
  targetName: { fontFamily: tokens.fonts.semibold },
  actions: { gap: 10 },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: tokens.radius.control,
  },
  primary: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
  danger: { backgroundColor: theme.colors.errorFill, borderColor: theme.colors.errorFill },
  cancel: { backgroundColor: theme.colors.glassSurface, borderColor: theme.colors.glassBorder },
  onPrimary: { color: theme.colors.onPrimary },
  onError: { color: theme.colors.onError },
  pressed: { opacity: 0.7 },
});
