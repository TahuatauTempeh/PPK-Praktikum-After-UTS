import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useDeviceColorScheme } from '@/hooks/use-device-color-scheme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AppColorScheme = 'light' | 'dark';

interface ThemePreferenceValue {
  mode: ThemeMode;
  scheme: AppColorScheme;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'ppk.theme-mode';

const ThemePreferenceContext = createContext<ThemePreferenceValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

/**
 * Preferensi tema aplikasi. Mode `system` mengikuti perangkat; pilihan
 * `light`/`dark` disimpan agar bertahan setelah aplikasi dibuka ulang.
 */
export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (active && isThemeMode(stored)) setModeState(stored);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const scheme = useMemo<AppColorScheme>(
    () => (mode === 'system' ? (deviceScheme === 'dark' ? 'dark' : 'light') : mode),
    [deviceScheme, mode]
  );

  const value = useMemo<ThemePreferenceValue>(
    () => ({ mode, scheme, setMode }),
    [mode, scheme, setMode]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceValue {
  const value = useContext(ThemePreferenceContext);
  if (!value) throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  return value;
}
