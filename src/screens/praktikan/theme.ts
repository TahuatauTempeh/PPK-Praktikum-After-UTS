/**
 * Token visual sisi praktikan: kobalt dan kaca, mengikuti sisi asisten (DESIGN.md P3).
 * textSecondary dibuat lebih gelap dari P3 (#5C6D86 hanya 4,31:1 di atas permukaan netral)
 * supaya lolos WCAG AA. Varian gelap dibuat sendiri karena P3 belum punya.
 */

import { TextStyle } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

const terang = {
  mode: 'terang',
  background: '#E8EFF9',
  dasarNav: '#E8EFF9',
  kartu: 'rgba(255,255,255,0.72)',
  kartuSorot: 'rgba(235,243,255,0.75)',
  garisKartu: 'rgba(255,255,255,0.95)',
  bayang: '0 8px 28px rgba(30,65,125,0.07)',
  hero: 'rgba(20,55,128,0.6)',
  heroTeks: '#FFFFFF',
  heroTeksLembut: '#EDF3FF',
  heroGaris: 'rgba(255,255,255,0.16)',
  teks: '#192138',
  teksSekunder: '#51627C',
  aksen: '#204CAC',
  isiAksen: '#2856B9',
  diAtasAksen: '#FFFFFF',
  isiLembut: 'rgba(222,232,248,0.65)',
  teksLembut: '#204CAC',
  lencanaBuka: '#DEF1B4',
  teksLencanaBuka: '#35501A',
  pemisah: 'rgba(53,85,142,0.1)',
  sukses: '#23765B',
  galat: '#B83E4D',
  galatLembut: '#FFF0F1',
  navLatar: 'rgba(255,255,255,0.85)',
  navAktif: '#DFE9FA',
  ikonNonaktif: '#51627C',
};

const gelap: typeof terang = {
  mode: 'gelap',
  background: '#0B1226',
  dasarNav: '#0B1226',
  kartu: 'rgba(24,34,66,0.78)',
  kartuSorot: 'rgba(34,52,102,0.8)',
  garisKartu: 'rgba(255,255,255,0.1)',
  bayang: '0 8px 28px rgba(0,0,0,0.3)',
  hero: 'rgba(20,45,110,0.7)',
  heroTeks: '#FFFFFF',
  heroTeksLembut: '#DCE7FF',
  heroGaris: 'rgba(255,255,255,0.16)',
  teks: '#EAF0FF',
  teksSekunder: '#9FB0CE',
  aksen: '#8FB0FF',
  isiAksen: '#3A6BDD',
  diAtasAksen: '#FFFFFF',
  isiLembut: 'rgba(58,90,160,0.28)',
  teksLembut: '#B7CBFF',
  lencanaBuka: '#34481A',
  teksLencanaBuka: '#DEF1B4',
  pemisah: 'rgba(255,255,255,0.1)',
  sukses: '#5FD0A8',
  galat: '#F28B96',
  galatLembut: '#3A1E24',
  navLatar: 'rgba(24,34,66,0.9)',
  navAktif: '#243564',
  ikonNonaktif: '#9FB0CE',
};

export type PraktikanTheme = typeof terang;

export function usePraktikanTheme(): PraktikanTheme {
  return useColorScheme() === 'dark' ? gelap : terang;
}

export const Tipe = {
  judulHalaman: { fontSize: 28, lineHeight: 35, fontWeight: '700', letterSpacing: -0.5 },
  detailTitle: { fontSize: 25, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  judulKartu: { fontSize: 20, lineHeight: 27, fontWeight: '700', letterSpacing: -0.5 },
  judulBagian: { fontSize: 20, lineHeight: 27, fontWeight: '700', letterSpacing: -0.4 },
  sectionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 14, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
  kecil: { fontSize: 11, lineHeight: 16, fontWeight: '400' },
  eyebrow: { fontSize: 10, lineHeight: 16, fontWeight: '600', letterSpacing: 1.8 },
  angka: { fontSize: 25, lineHeight: 32, fontWeight: '700' },
} satisfies Record<string, TextStyle>;

export const LebarKonten = 600;
