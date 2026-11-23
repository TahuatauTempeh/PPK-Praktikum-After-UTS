/**
 * TimeField: kolom pemilih jam untuk form asisten.
 * Metro memilih berkas per platform: time-field.ios.tsx (picker ringkas iOS),
 * time-field.web.tsx (input ketik, karena picker @expo/ui tidak dirender di web),
 * dan berkas ini untuk Android (dialog jam Material 3).
 */

export { TimeFieldDialog as TimeField } from './time-field-dialog';
export type { TimeFieldProps } from './time-field-utils';
