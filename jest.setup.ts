/**
 * Pengaturan bersama test.
 *
 * Komponen diuji tanpa ThemePreferenceProvider supaya tidak bergantung pada
 * AsyncStorage dan animasi fade. Skema warna dikunci ke terang agar assertion
 * warna/teks deterministik.
 */
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => 'light' as const,
}));
