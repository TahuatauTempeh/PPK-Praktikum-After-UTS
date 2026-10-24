/** Baseline sisi Asisten dari DESIGN.md; dapat dipetakan ke theme bersama P1. */
export const assistantTheme = {
  colors: {
    background: '#F6F7FB',
    surface: '#FFFFFF',
    primary: '#4B4ACF',
    primarySoft: '#ECECFC',
    textPrimary: '#192138',
    textSecondary: '#6D7588',
    neutralSoft: '#EFF1F6',
    border: '#DDE0EB',
    success: '#23765B',
    error: '#B83E4D',
    errorSoft: '#FFF0F1',
  },
  spacing: { xs: 4, sm: 8, md: 12, section: 18, page: 24, lg: 32 },
  radius: { control: 12, card: 18, panel: 26, pill: 999 },
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  typography: {
    pageTitle: { fontSize: 27, lineHeight: 34, fontFamily: 'Inter_700Bold' },
    detailTitle: { fontSize: 25, lineHeight: 32, fontFamily: 'Inter_700Bold' },
    sectionTitle: { fontSize: 16, lineHeight: 22, fontFamily: 'Inter_700Bold' },
    body: { fontSize: 14, lineHeight: 22, fontFamily: 'Inter_400Regular' },
    greeting: { fontSize: 13, lineHeight: 16, fontFamily: 'Inter_400Regular' },
    label: { fontSize: 15, lineHeight: 20, fontFamily: 'Inter_600SemiBold' },
    caption: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  },
} as const;
