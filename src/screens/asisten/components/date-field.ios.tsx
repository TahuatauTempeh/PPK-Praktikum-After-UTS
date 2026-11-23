/**
 * DateField (iOS): picker tanggal ringkas bawaan iOS. Ketukan membuka kalender di popover.
 * iOS bersifat best-effort (PRD 9.5); target utama tetap Android.
 */

import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { dateKeTanggal, tanggalKeDate, type DateFieldProps } from './date-field-utils';

export type { DateFieldProps };

export function DateField({ value, onChange, accessibilityLabel, disabled = false, style }: DateFieldProps) {
  const theme = useTheme();

  return (
    <View style={[style, styles.isi]} accessibilityLabel={accessibilityLabel}>
      <DateTimePicker
        mode="date"
        display="compact"
        locale="id_ID"
        value={tanggalKeDate(value)}
        disabled={disabled}
        accentColor={theme.colors.primary}
        themeVariant={theme.scheme}
        onValueChange={(_event, tanggal) => onChange(dateKeTanggal(tanggal))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  isi: { alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 4 },
});
