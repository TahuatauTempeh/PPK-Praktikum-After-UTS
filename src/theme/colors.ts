/**
 * Palet warna semantik untuk terang dan gelap.
 *
 * Satu nama mewakili satu peran di seluruh aplikasi. Saat tiga palet lama
 * digabung, nilai yang dipakai mayoritas dipertahankan dan nilai minoritas
 * disamakan, kecuali yang sudah lolos audit kontras di kedua sisi:
 *
 * - Aksen teks dan isian memakai #204CAC. Isian Praktikan sebelumnya #2856B9
 *   dan aksen auth #1D4ED8; keduanya nilai minoritas.
 * - Galat memakai #AE3645. Asisten sebelumnya #B83E4D (minoritas).
 * - Hero memakai alpha 0.8. Banner Praktikan sebelumnya 0.6 (minoritas).
 * - `lime` tetap terang di kedua mode; lencana Praktikan yang sebelumnya
 *   memakai lime gelap di mode gelap mengikuti varian mayoritas.
 *
 * `surface` adalah bidang opak untuk sheet dan dialog. Teks putih di atas hero
 * memakai `onHero`, bukan `surface`, supaya satu token tidak dipakai untuk dua
 * tugas yang berbeda.
 */

export type ThemeColors = {
  background: string;
  surface: string;
  panel: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  hairline: string;
  primary: string;
  primaryFill: string;
  onPrimary: string;
  primarySoft: string;
  onPrimarySoft: string;
  neutralSoft: string;
  success: string;
  successFill: string;
  onSuccess: string;
  successSoft: string;
  error: string;
  errorFill: string;
  onError: string;
  errorSoft: string;
  glassSurface: string;
  glassCard: string;
  glassMuted: string;
  glassBorder: string;
  cardOpen: string;
  softSurface: string;
  glassHero: string;
  heroSoft: string;
  heroMuted: string;
  heroLine: string;
  heroWash: string;
  onHero: string;
  lime: string;
  onLime: string;
  iconMuted: string;
  navSurface: string;
  shadow: string;
  shadowSmall: string;
  scrim: string;
  glassSheenStart: string;
  glassSheenEnd: string;
  glassGlowBlue: string;
  glassGlowLime: string;
};

export const light: ThemeColors = {
  background: '#E8EFF9',
  surface: '#FFFFFF',
  panel: '#F1F6FE',
  textPrimary: '#192138',
  textSecondary: '#4C5D75',
  border: '#CBD8EA',
  hairline: 'rgba(53,85,142,0.1)',
  primary: '#204CAC',
  primaryFill: '#204CAC',
  onPrimary: '#FFFFFF',
  primarySoft: '#DFE9FA',
  onPrimarySoft: '#D5E3FF',
  neutralSoft: '#E5EDF8',
  success: '#23765B',
  successFill: '#23765B',
  onSuccess: '#FFFFFF',
  successSoft: '#E8F5EF',
  error: '#AE3645',
  errorFill: '#AE3645',
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
  onHero: '#FFFFFF',
  lime: '#DEF1B4',
  onLime: '#35501A',
  iconMuted: '#6D7588',
  navSurface: 'rgba(255,255,255,0.85)',
  shadow: '0 8px 28px rgba(30,65,125,0.07)',
  shadowSmall: '0 4px 16px rgba(30,65,125,0.08)',
  scrim: 'rgba(12,32,70,0.42)',
  glassSheenStart: 'rgba(255,255,255,0.94)',
  glassSheenEnd: 'rgba(247,250,255,0.65)',
  glassGlowBlue: 'rgba(167,199,255,0.55)',
  glassGlowLime: 'rgba(227,239,168,0.4)',
};

export const dark: ThemeColors = {
  background: '#0B1226',
  surface: '#1F2937',
  panel: '#16213D',
  textPrimary: '#EAF0FF',
  textSecondary: '#9FB0CE',
  border: 'rgba(255,255,255,0.14)',
  hairline: 'rgba(255,255,255,0.1)',
  primary: '#8FB0FF',
  primaryFill: '#3A6BDD',
  onPrimary: '#FFFFFF',
  primarySoft: '#243564',
  onPrimarySoft: '#DCE7FF',
  neutralSoft: '#1C2947',
  success: '#5FD0A8',
  successFill: '#23765B',
  onSuccess: '#FFFFFF',
  successSoft: '#12352B',
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
  onHero: '#FFFFFF',
  lime: '#DEF1B4',
  onLime: '#35501A',
  iconMuted: '#9FB0CE',
  navSurface: 'rgba(24,34,66,0.9)',
  shadow: '0 8px 28px rgba(0,0,0,0.35)',
  shadowSmall: '0 4px 16px rgba(0,0,0,0.3)',
  scrim: 'rgba(2,8,23,0.62)',
  glassSheenStart: 'rgba(42,59,102,0.95)',
  glassSheenEnd: 'rgba(22,33,61,0.7)',
  glassGlowBlue: 'rgba(92,134,232,0.35)',
  glassGlowLime: 'rgba(183,207,110,0.14)',
};
