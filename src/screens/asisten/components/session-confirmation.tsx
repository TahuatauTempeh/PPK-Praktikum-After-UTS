import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AssistantSheet } from './assistant-sheet';

import { type AssistantSession } from '../schedule-data';
import { formatSessionDate } from '../session-format';
import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

type Props = {
  session: AssistantSession;
  mode: 'open' | 'close';
  present: number;
  total: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SessionConfirmation({ session, mode, present, total, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<ComponentRef<typeof Pressable>>(null);
  const closing = mode === 'close';
  const title = closing ? 'Tutup sesi ini?' : 'Buka sesi sekarang?';
  return (
    <AssistantSheet onCancel={onCancel} onShow={() => cancelRef.current?.focus()}>
      <View style={styles.dialog} role="dialog" accessibilityViewIsModal accessibilityLabel={title}>
        <View style={[styles.icon, closing && styles.dangerIcon]}>
          <ScheduleIcon name={closing ? 'lockDanger' : 'doorOpen'} size={24} />
        </View>
        <View style={styles.message}>
          <AssistantText style={styles.title} accessibilityRole="header">{title}</AssistantText>
          <AssistantText tone="secondary">{closing
            ? 'Presensi baru tidak akan diterima. Sesi yang ditutup tidak dapat dibuka kembali.'
            : 'Praktikan dapat mengisi presensi setelah sesi dibuka.'}</AssistantText>
        </View>
        <View style={styles.session}>
          <AssistantText style={styles.sessionTitle}>{session.course} · {session.className}</AssistantText>
          <AssistantText variant="caption" tone="secondary">{session.topic}</AssistantText>
          <AssistantText variant="caption" tone="secondary">
            {formatSessionDate(session.date)} · {session.startTime.replace(':', '.')}–{session.endTime.replace(':', '.')} WIB
          </AssistantText>
          {closing && <View style={styles.totals}>
            <AssistantText variant="caption" tone="accent" style={styles.bold}>{present} dari {total} hadir</AssistantText>
            <AssistantText variant="caption" tone="secondary">{total - present} belum tercatat hadir</AssistantText>
          </View>}
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onConfirm}
            style={({ pressed }) => [styles.button, styles.primary, closing && styles.danger, pressed && styles.pressed]}>
            <AssistantText variant="label" style={styles.white}>Ya, {closing ? 'tutup' : 'buka'} sesi</AssistantText>
          </Pressable>
          <Pressable ref={cancelRef} accessibilityRole="button" onPress={onCancel}
            style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}>
            <AssistantText variant="label" tone="accent">Batal</AssistantText>
          </Pressable>
        </View>
      </View>
    </AssistantSheet>
  );
}

const styles = StyleSheet.create({
  dialog: { width: '100%', backgroundColor: theme.colors.surface, padding: 24, gap: 20 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dangerIcon: { backgroundColor: theme.colors.errorSoft },
  message: { gap: 9 },
  title: { fontSize: 23, lineHeight: 30, fontFamily: theme.fonts.bold },
  session: { padding: 14, gap: 7, backgroundColor: theme.colors.background, borderRadius: theme.radius.control },
  sessionTitle: { fontFamily: theme.fonts.semibold },
  totals: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingTop: 7 },
  bold: { fontFamily: theme.fonts.semibold },
  actions: { gap: 10 },
  button: { minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.control, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 14 },
  primary: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  danger: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
  cancel: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  white: { color: theme.colors.surface },
  pressed: { opacity: 0.7 },
});
