/**
 * Token non-warna: tipografi, jarak, radius, dan lebar konten.
 *
 * Satu sumber untuk seluruh area aplikasi. Nilai di sini diambil dari token
 * yang paling banyak dipakai saat palet Asisten, Praktikan, dan auth masih
 * terpisah, sehingga tampilan yang sudah diaudit tidak berubah tanpa sengaja.
 */

import { Platform, type TextStyle } from 'react-native';

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /** Angka nomor sesi memakai monospace platform; Inter tidak punya tabular mono. */
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) ?? 'monospace',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  section: 18,
  page: 24,
  lg: 32,
  xxl: 64,
} as const;

export const radius = {
  control: 20,
  card: 28,
  panel: 32,
  banner: 30,
  block: 24,
  button: 21,
  pill: 999,
} as const;

export const typography = {
  pageTitle: { fontSize: 27, lineHeight: 34, letterSpacing: -0.5, fontFamily: fonts.bold },
  detailTitle: { fontSize: 25, lineHeight: 32, letterSpacing: -0.4, fontFamily: fonts.bold },
  sectionTitle: { fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },
  cardTitle: { fontSize: 19, lineHeight: 25, letterSpacing: -0.4, fontFamily: fonts.bold },
  sectionHeading: { fontSize: 20, lineHeight: 27, letterSpacing: -0.4, fontFamily: fonts.bold },
  timeDisplay: { fontSize: 30, lineHeight: 38, fontFamily: fonts.bold },
  numeric: { fontSize: 25, lineHeight: 32, fontFamily: fonts.bold },
  greeting: { fontSize: 13, lineHeight: 16, fontFamily: fonts.regular },
  body: { fontSize: 14, lineHeight: 22, fontFamily: fonts.regular },
  label: { fontSize: 15, lineHeight: 20, fontFamily: fonts.semibold },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: fonts.regular },
  tiny: { fontSize: 11, lineHeight: 16, fontFamily: fonts.regular },
  eyebrow: { fontSize: 10, lineHeight: 16, letterSpacing: 1.8, fontFamily: fonts.semibold },
} as const satisfies Record<string, TextStyle>;

/** Lebar maksimum kolom konten di semua layar. */
export const contentWidth = 600;
