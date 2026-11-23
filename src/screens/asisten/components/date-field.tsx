/**
 * DateField: kolom pemilih tanggal untuk form asisten.
 * Metro memilih berkas per platform: date-field.ios.tsx (picker ringkas iOS),
 * date-field.web.tsx (input ketik, karena picker @expo/ui tidak dirender di web),
 * dan berkas ini untuk Android (dialog kalender Material 3).
 */

export { DateFieldDialog as DateField } from './date-field-dialog';
export type { DateFieldProps } from './date-field-utils';
