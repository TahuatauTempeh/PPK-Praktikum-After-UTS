/**
 * Sumber tunggal tema aplikasi.
 *
 * Sebelumnya ada tiga palet terpisah (auth/shared, Asisten, Praktikan) dengan
 * 17 nilai identik, tiga biru aksen, dan dua merah galat. Modul ini menyatukan
 * semuanya: satu peta peran warna, satu skala tipografi, satu set jarak/radius.
 *
 * Pemakaian:
 * - `useTheme()` untuk warna dan token mentah di dalam komponen.
 * - `useThemedStyles(factory)` untuk StyleSheet yang ikut berganti tema.
 *
 * `factory` wajib ditulis di module scope supaya referensinya stabil dan
 * `useMemo` tidak membuat ulang styles tiap render.
 */

import '@/global.css';

import { useMemo } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { dark, light, type ThemeColors } from './colors';
import { contentWidth, fonts, radius, spacing, typography } from './tokens';

export const tokens = { spacing, radius, fonts, typography, contentWidth } as const;

export type Theme = {
  colors: ThemeColors;
  scheme: 'light' | 'dark';
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  typography: typeof typography;
  contentWidth: number;
};

const themes: Record<Theme['scheme'], Theme> = {
  light: { ...tokens, colors: light, scheme: 'light' },
  dark: { ...tokens, colors: dark, scheme: 'dark' },
};

/** Tema aplikasi sesuai preferensi pengguna (system/light/dark). */
export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? themes.dark : themes.light;
}

/** Style yang ikut berganti tema. Pabriknya harus berada di module scope. */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

export { contentWidth, fonts, radius, spacing, typography };
export type { ThemeColors };
