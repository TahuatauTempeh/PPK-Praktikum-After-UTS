import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Animated, Easing, Platform } from 'react-native';

import { ThemeFade } from '@/components/ThemeFade';
import { useDeviceColorScheme } from '@/hooks/use-device-color-scheme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AppColorScheme = 'light' | 'dark';

interface ThemePreferenceValue {
  mode: ThemeMode;
  scheme: AppColorScheme;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'ppk.theme-mode';

/**
 * Fade-through saat palet berganti: tirai latar tema tujuan memudar masuk,
 * palet ditukar saat tirai opak, lalu tirai memudar keluar. Bagian masuk lebih
 * singkat daripada bagian keluar supaya respons ketukan tetap terasa cepat.
 */
const FADE_IN = 160;
const FADE_OUT = 220;

const ThemePreferenceContext = createContext<ThemePreferenceValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

function resolveScheme(
  mode: ThemeMode,
  deviceScheme: AppColorScheme | null | undefined
): AppColorScheme {
  return mode === 'system' ? (deviceScheme === 'dark' ? 'dark' : 'light') : mode;
}

/**
 * Preferensi tema aplikasi. Mode `system` mengikuti perangkat; pilihan
 * `light`/`dark` disimpan agar bertahan setelah aplikasi dibuka ulang.
 *
 * `mode` berubah seketika (indikator pemilih dan AsyncStorage), sedangkan
 * `scheme` yang dipakai seluruh halaman baru berganti di tengah fade. Dengan
 * begitu pergantian palet tidak pernah terlihat sebagai lompatan warna.
 */
export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  // Skema perangkat saat pertama dipasang, untuk memulihkan preferensi
  // tersimpan tanpa animasi.
  const [mountDeviceScheme] = useState(deviceScheme);

  const [mode, setModeState] = useState<ThemeMode>('system');
  const [scheme, setScheme] = useState<AppColorScheme>(() =>
    resolveScheme('system', deviceScheme)
  );
  /** Skema yang sedang dipudarkan masuk; `null` berarti tidak ada transisi. */
  const [veil, setVeil] = useState<AppColorScheme | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));

  const goal = resolveScheme(mode, deviceScheme);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active || !isThemeMode(stored)) return;
        // Preferensi yang dipulihkan langsung dipakai: fade hanya untuk
        // pergantian tema oleh pengguna, bukan untuk render pertama.
        setModeState(stored);
        setScheme(resolveScheme(stored, mountDeviceScheme));
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [mountDeviceScheme]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  // 1. Tutup layar dengan latar tema tujuan.
  useEffect(() => {
    if (veil !== null || goal === scheme) return;

    // Tirai dipasang pada frame berikutnya agar lapisan opak sempat termount
    // sebelum palet lama terlihat berganti.
    const frame = requestAnimationFrame(() => {
      setVeil(goal);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (finished) setScheme(goal);
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [goal, opacity, scheme, veil]);

  // 2. Buka kembali setelah palet baru ter-commit.
  useEffect(() => {
    if (veil === null || scheme !== veil) return;

    const frame = requestAnimationFrame(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        if (finished) setVeil(null);
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [opacity, scheme, veil]);

  const value = useMemo<ThemePreferenceValue>(
    () => ({ mode, scheme, setMode }),
    [mode, scheme, setMode]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
      {veil ? <ThemeFade scheme={veil} opacity={opacity} /> : null}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceValue {
  const value = useContext(ThemePreferenceContext);
  if (!value) throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  return value;
}
