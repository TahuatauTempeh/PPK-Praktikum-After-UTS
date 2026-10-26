/**
 * Token visual sisi praktikan, mengikuti DESIGN.md sisi asisten supaya satu gaya.
 * textSecondary dibuat lebih gelap dari DESIGN.md (#6D7588 hanya 4,31:1 di atas
 * #F6F7FB) agar lolos WCAG AA.
 */

import { TextStyle } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

const light = {
  background: '#F6F7FB',
  surface: '#FFFFFF',
  primary: '#4B4ACF',
  primarySoft: '#ECECFC',
  onPrimary: '#FFFFFF',
  text: '#192138',
  textSecondary: '#5B6376',
  neutralSoft: '#EFF1F6',
  border: '#DDE0EB',
  success: '#23765B',
  error: '#B83E4D',
  errorSoft: '#FFF0F1',
};

const dark: typeof light = {
  background: '#0F1220',
  surface: '#1A1E33',
  primary: '#A5A4F5',
  primarySoft: '#2A2B5C',
  onPrimary: '#0F1220',
  text: '#F1F3FA',
  textSecondary: '#A4ABBF',
  neutralSoft: '#242946',
  border: '#2C3150',
  success: '#5FD0A8',
  error: '#F28B96',
  errorSoft: '#3A1E24',
};

export type PraktikanTheme = typeof light;

export function usePraktikanTheme(): PraktikanTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

export const Tipe = {
  detailTitle: { fontSize: 25, lineHeight: 32, fontWeight: '700' },
  cardTitle: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  sectionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
} satisfies Record<string, TextStyle>;

export const LebarKonten = 600;
