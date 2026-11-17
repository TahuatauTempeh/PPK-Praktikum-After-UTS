import { useThemePreference } from '@/context/theme-context';

/** Skema warna aplikasi setelah preferensi pengguna diterapkan. */
export function useColorScheme() {
  return useThemePreference().scheme;
}
