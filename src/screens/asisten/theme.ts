/**
 * Token visual bersama untuk seluruh sisi Asisten dan admin.
 *
 * Warna dipisah per peran supaya satu nilai tidak dipakai untuk dua tugas:
 * - `primary`/`error`/`success` untuk teks dan ikon di atas latar terang.
 * - `primaryFill`/`errorFill` untuk isian kontrol; pasangkan dengan
 *   `onPrimary`/`onError` agar teks putih tetap lolos WCAG AA di mode gelap.
 * - `glass*` untuk permukaan kaca, `hero*` untuk isi hero yang tetap kobalt.
 *
 * Palet gelap mengikuti keluarga navy Praktikan supaya kedua sisi aplikasi
 * terlihat satu sistem. Spacing, radius, dan tipografi tidak berubah.
 */

import { useMemo } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

const spacing = { xs: 4, sm: 8, md: 12, section: 18, page: 24, lg: 32 } as const;

const radius = {
  control: 20,
  card: 28,
  panel: 32,
  banner: 30,
  block: 24,
  button: 21,
  pill: 999,
} as const;

const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const typography = {
  pageTitle: { fontSize: 27, lineHeight: 34, fontFamily: 'Inter_700Bold' },
  detailTitle: { fontSize: 25, lineHeight: 32, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 16, lineHeight: 22, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 14, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  greeting: { fontSize: 13, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  label: { fontSize: 15, lineHeight: 20, fontFamily: 'Inter_600SemiBold' },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
} as const;

export const assistantTokens = { spacing, radius, fonts, typography } as const;

const terang = {
  background: '#E8EFF9',
  surface: '#FFFFFF',
  primary: '#204CAC',
  primaryFill: '#204CAC',
  onPrimary: '#FFFFFF',
  primarySoft: '#DFE9FA',
  onPrimarySoft: '#D5E3FF',
  textPrimary: '#192138',
  textSecondary: '#4C5D75',
  neutralSoft: '#E5EDF8',
  border: '#CBD8EA',
  hairline: 'rgba(53,85,142,0.1)',
  success: '#23765B',
  error: '#B83E4D',
  errorFill: '#B83E4D',
  onError: '#FFFFFF',
  errorSoft: '#FFF0F1',
  glassSurface: 'rgba(255,255,255,0.8)',
  glassCard: 'rgba(255,255,255,0.72)',
  glassMuted: 'rgba(255,255,255,0.6)',
  glassBorder: 'rgba(255,255,255,0.95)',
  cardOpen: 'rgba(235,243,255,0.75)',
  softSurface: 'rgba(222,232,248,0.65)',
  glassHero: 'rgba(20,55,128,0.8)',
  heroSoft: '#EDF3FF',
  heroMuted: 'rgba(255,255,255,0.8)',
  heroLine: 'rgba(255,255,255,0.2)',
  heroWash: 'rgba(255,255,255,0.12)',
  lime: '#DEF1B4',
  onLime: '#35501A',
  iconPrimary: '#4B4ACF',
  iconMuted: '#6D7588',
  shadow: '0 8px 28px rgba(30,65,125,0.07)',
  shadowSmall: '0 4px 16px rgba(30,65,125,0.08)',
  panel: '#F1F6FE',
  scrim: 'rgba(12,32,70,0.42)',
  glassSheenStart: 'rgba(255,255,255,0.94)',
  glassSheenEnd: 'rgba(247,250,255,0.65)',
  glassGlowBlue: 'rgba(167,199,255,0.55)',
  glassGlowLime: 'rgba(227,239,168,0.4)',
};

const gelap: typeof terang = {
  background: '#0B1226',
  surface: '#FFFFFF',
  primary: '#8FB0FF',
  primaryFill: '#3A6BDD',
  onPrimary: '#FFFFFF',
  primarySoft: '#243564',
  onPrimarySoft: '#DCE7FF',
  textPrimary: '#EAF0FF',
  textSecondary: '#9FB0CE',
  neutralSoft: '#1C2947',
  border: 'rgba(255,255,255,0.14)',
  hairline: 'rgba(255,255,255,0.1)',
  success: '#5FD0A8',
  error: '#F28B96',
  errorFill: '#AE3645',
  onError: '#FFFFFF',
  errorSoft: '#3A1E24',
  glassSurface: 'rgba(24,34,66,0.78)',
  glassCard: 'rgba(24,34,66,0.78)',
  glassMuted: 'rgba(24,34,66,0.62)',
  glassBorder: 'rgba(255,255,255,0.12)',
  cardOpen: 'rgba(34,52,102,0.8)',
  softSurface: 'rgba(58,90,160,0.28)',
  glassHero: 'rgba(18,40,96,0.82)',
  heroSoft: '#DCE7FF',
  heroMuted: 'rgba(255,255,255,0.75)',
  heroLine: 'rgba(255,255,255,0.18)',
  heroWash: 'rgba(255,255,255,0.1)',
  lime: '#DEF1B4',
  onLime: '#35501A',
  iconPrimary: '#8FB0FF',
  iconMuted: '#9FB0CE',
  shadow: '0 8px 28px rgba(0,0,0,0.35)',
  shadowSmall: '0 4px 16px rgba(0,0,0,0.3)',
  panel: '#16213D',
  scrim: 'rgba(2,8,23,0.62)',
  glassSheenStart: 'rgba(42,59,102,0.95)',
  glassSheenEnd: 'rgba(22,33,61,0.7)',
  glassGlowBlue: 'rgba(92,134,232,0.35)',
  glassGlowLime: 'rgba(183,207,110,0.14)',
};

export type AssistantColors = typeof terang;

export type AssistantTheme = typeof assistantTokens & {
  colors: AssistantColors;
  scheme: 'light' | 'dark';
};

const tema = {
  terang: { ...assistantTokens, colors: terang, scheme: 'light' as const },
  gelap: { ...assistantTokens, colors: gelap, scheme: 'dark' as const },
};

/** Palet Asisten sesuai preferensi tema pengguna. */
export function useAssistantTheme(): AssistantTheme {
  return useColorScheme() === 'dark' ? tema.gelap : tema.terang;
}

/**
 * Style yang ikut berganti tema. Pabriknya ditulis di module scope supaya
 * referensinya stabil dan `useMemo` tidak membuat ulang styles tiap render.
 */
export function useAssistantStyles<T>(factory: (theme: AssistantTheme) => T): T {
  const theme = useAssistantTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
