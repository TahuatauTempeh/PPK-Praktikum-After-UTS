/**
 * TimeField (iOS): picker jam ringkas bawaan iOS. Ketukan membuka roda jam di popover.
 * iOS bersifat best-effort (PRD 9.5); target utama tetap Android.
 */

import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { dateKeJam, jamKeDate, type TimeFieldProps } from './time-field-utils';

export type { TimeFieldProps };

export function TimeField({
  value,
  onChange,
  accessibilityLabel,
  disabled = false,
  style,
  testID,
}: TimeFieldProps) {
  const theme = useTheme();

  return (
    <View testID={testID} style={[style, styles.isi]} accessibilityLabel={accessibilityLabel}>
      <DateTimePicker
        mode="time"
        display="compact"
        locale="id_ID"
        value={jamKeDate(value)}
        disabled={disabled}
        accentColor={theme.colors.primary}
        themeVariant={theme.scheme}
        onValueChange={(_event, tanggal) => onChange(dateKeJam(tanggal))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  isi: { alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 4 },
});
