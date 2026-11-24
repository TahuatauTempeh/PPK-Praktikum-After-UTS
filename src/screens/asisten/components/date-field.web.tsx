/**
 * DateField (web): picker @expo/ui tidak dirender di web, jadi tanggal tetap diketik
 * "YYYY-MM-DD". Format diperiksa saat form disimpan (parseDateInput).
 */

import { TextInput, type TextStyle } from 'react-native';

import { useTheme } from '@/theme';

import type { DateFieldProps } from './date-field-utils';

export type { DateFieldProps };

export function DateField({
  value,
  onChange,
  accessibilityLabel,
  disabled = false,
  style,
  testID,
}: DateFieldProps) {
  const theme = useTheme();

  return (
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD, mis. 2026-11-20"
      placeholderTextColor={theme.colors.textSecondary}
      editable={!disabled}
      maxLength={10}
      keyboardType="numbers-and-punctuation"
      style={style as TextStyle}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
