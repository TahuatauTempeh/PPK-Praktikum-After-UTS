import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { ComponentProps } from 'react';

import { assistantTheme as theme } from '../theme';
import { AssistantText } from './assistant-text';
import { ScheduleIcon } from './schedule-icon';

type Props = {
  label: string; value: string; placeholder: string; error?: string;
  icon?: ComponentProps<typeof ScheduleIcon>['name'];
  onPress?: () => void; onChangeText?: (value: string) => void;
};
export function SessionFormField({ label, value, placeholder, error, icon, onPress, onChangeText }: Props) {
  const content = <>
    <AssistantText style={styles.value} tone={value ? 'primary' : 'secondary'}>{value || placeholder}</AssistantText>
    {icon && <ScheduleIcon name={icon} size={17} />}
  </>;
  return (
    <View style={styles.field}>
      <AssistantText variant="caption" style={styles.label}>{label} *</AssistantText>
      {onPress ? <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value || placeholder}`}
        aria-required aria-invalid={Boolean(error)} onPress={onPress}
        style={({ pressed }) => [styles.control, error && styles.invalid, pressed && styles.pressed]}>
        {content}
      </Pressable> : <View style={[styles.control, error && styles.invalid]}>
        <TextInput accessibilityLabel={label} aria-required aria-invalid={Boolean(error)}
          value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.textSecondary}
          style={styles.input} />
        {icon && <ScheduleIcon name={icon} size={17} />}
      </View>}
      {error && <View style={styles.errorRow}>
        <ScheduleIcon name="formError" size={12} />
        <AssistantText style={styles.error} accessibilityRole="alert">{error}</AssistantText>
      </View>}
    </View>
  );
}
const styles = StyleSheet.create({
  field: { gap: 7, flexGrow: 1 },
  label: { fontFamily: theme.fonts.semibold },
  control: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.control, backgroundColor: theme.colors.surface },
  value: { flex: 1, paddingVertical: 13, fontSize: 14, lineHeight: 21 },
  input: { flex: 1, minWidth: 0, paddingVertical: 13, fontFamily: theme.fonts.regular, fontSize: 16, lineHeight: 22, color: theme.colors.textPrimary },
  invalid: { borderColor: theme.colors.error },
  errorRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  error: { flex: 1, fontSize: 11, lineHeight: 16, color: theme.colors.error },
  pressed: { opacity: 0.7 },
});
