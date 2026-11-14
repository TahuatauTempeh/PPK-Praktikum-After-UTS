/**
 * Token warna bersama untuk auth, admin, dan komponen shared.
 *
 * Peran warna dipisahkan supaya satu nilai tidak dipakai untuk dua tugas yang
 * berbeda:
 * - primary/success/danger/warning: teks dan ikon di atas latar terang.
 * - primaryFill/successFill/dangerFill: isian kontrol; pasangkan dengan
 *   onPrimary/onSuccess/onDanger.
 * Di mode gelap, warna teks aksen tetap terang, sedangkan isian kontrol memakai
 * versi gelap agar teks putih tetap lolos WCAG AA.
 *
 * Nilai sudah diuji dengan stateofcolors.com (14 Nov 2026). border tetap lembut
 * karena dipakai sebagai garis dekoratif, bukan satu-satunya penanda kontrol.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    // Warna aplikasi presensi
    primary: '#1D4ED8',
    primaryLight: '#DBEAFE',
    primaryFill: '#1D4ED8',
    onPrimary: '#FFFFFF',
    success: '#23765B',
    successLight: '#D1FAE5',
    successFill: '#23765B',
    onSuccess: '#FFFFFF',
    danger: '#AE3645',
    dangerLight: '#FEE2E2',
    dangerFill: '#AE3645',
    onDanger: '#FFFFFF',
    warning: '#7A4A00',
    warningLight: '#FEF3C7',
    border: '#E5E7EB',
    card: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    // Warna aplikasi presensi
    primary: '#60A5FA',
    primaryLight: '#1E3A5F',
    primaryFill: '#1D4ED8',
    onPrimary: '#FFFFFF',
    success: '#34D399',
    successLight: '#064E3B',
    successFill: '#23765B',
    onSuccess: '#FFFFFF',
    danger: '#F87171',
    dangerLight: '#3A1E24',
    dangerFill: '#AE3645',
    onDanger: '#FFFFFF',
    warning: '#FBBF24',
    warningLight: '#78350F',
    border: '#374151',
    card: '#1F2937',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
