/**
 * TimeField (web): picker @expo/ui tidak dirender di web, jadi jam tetap diketik "HH:MM".
 * Format diperiksa saat form disimpan (validateTimeRange).
 */

import { TextInput, type TextStyle } from 'react-native';

import { useTheme } from '@/theme';

import type { TimeFieldProps } from './time-field-utils';

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
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChange}
      placeholder="08:00"
      placeholderTextColor={theme.colors.textSecondary}
      editable={!disabled}
      maxLength={5}
      keyboardType="numbers-and-punctuation"
      style={style as TextStyle}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
