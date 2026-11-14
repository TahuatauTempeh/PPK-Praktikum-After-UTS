import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { UserProfile } from '@/types';

import { assistantTokens, useAssistantStyles, useAssistantTheme, type AssistantTheme } from '../theme';
import { AssistantSheet } from './assistant-sheet';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

type Props = {
  target: UserProfile;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Konfirmasi perubahan role di halaman admin, memakai sheet Asisten. */
export function AdminRoleConfirmation({ target, onCancel, onConfirm }: Props) {
  const theme = useAssistantTheme();
  const styles = useAssistantStyles(gaya);
  const cancelRef = useRef<ComponentRef<typeof Pressable>>(null);
  const promoting = target.role === 'praktikan';
  const title = promoting ? 'Jadikan Asisten?' : 'Jadikan Praktikan?';

  return (
    <AssistantSheet onCancel={onCancel} onShow={() => cancelRef.current?.focus()}>
      {closeSheet => (
        <View role="dialog" accessibilityViewIsModal accessibilityLabel={title} style={styles.dialog}>
          <View style={[styles.icon, promoting ? styles.promoteIcon : styles.demoteIcon]}>
            <ScheduleIcon name={promoting ? 'usersPrimary' : 'lockDanger'} size={24}
              tintColor={promoting ? theme.colors.primary : theme.colors.error} />
          </View>

          <View style={styles.message}>
            <AssistantText style={styles.title} accessibilityRole="header">
              {title}
            </AssistantText>
            <AssistantText tone="secondary">
              {promoting
                ? `${target.name} akan mendapat akses fitur asisten.`
                : `${target.name} akan kehilangan akses fitur asisten.`}
            </AssistantText>
          </View>

          <View style={styles.target}>
            <AssistantText style={styles.targetName}>{target.name}</AssistantText>
            <AssistantText variant="caption" tone="secondary">
              {target.nim} · {target.email}
            </AssistantText>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                promoting
                  ? `Jadikan ${target.name} sebagai Asisten`
                  : `Jadikan ${target.name} sebagai Praktikan`
              }
              onPress={() => closeSheet(onConfirm)}
              style={({ pressed }) => [
                styles.button,
                promoting ? styles.primary : styles.danger,
                pressed && styles.pressed,
              ]}
            >
              <AssistantText variant="label" style={styles.white}>
                {promoting ? 'Ya, jadikan Asisten' : 'Ya, jadikan Praktikan'}
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

const gaya = (theme: AssistantTheme) => StyleSheet.create({
  dialog: { width: '100%', backgroundColor: 'transparent', padding: 24, gap: 20 },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  promoteIcon: { backgroundColor: theme.colors.primarySoft },
  demoteIcon: { backgroundColor: theme.colors.errorSoft },
  message: { gap: 9 },
  title: { fontSize: 23, lineHeight: 30, fontFamily: assistantTokens.fonts.bold },
  target: {
    gap: 7,
    padding: 14,
    backgroundColor: theme.colors.glassSurface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    borderRadius: assistantTokens.radius.control,
  },
  targetName: { fontFamily: assistantTokens.fonts.semibold },
  actions: { gap: 10 },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: assistantTokens.radius.control,
  },
  primary: { backgroundColor: theme.colors.primaryFill, borderColor: theme.colors.primaryFill },
  danger: { backgroundColor: theme.colors.errorFill, borderColor: theme.colors.errorFill },
  cancel: { backgroundColor: theme.colors.glassSurface, borderColor: theme.colors.glassBorder },
  white: { color: theme.colors.onPrimary },
  pressed: { opacity: 0.7 },
});
