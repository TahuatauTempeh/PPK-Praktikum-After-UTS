/**
 * Context dan Provider Notifikasi (Sprint 3 - Dev 4).
 * Mengelola siklus hidup status notifikasi, pendaftaran token, dan observer deep link.
 */

import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { useNotificationObserver } from '@/hooks/use-notification-observer';
import {
  checkNotificationPermission,
  getExpoPushToken,
  isPushNotificationSupported,
  openNotificationSettings,
  registerPushToken,
  requestNotificationPermission,
} from '@/lib/notification-service';
import type { NotificationContextValue, NotificationStatus } from '@/types';

export { useNotificationObserver } from '@/hooks/use-notification-observer';

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { profile } = useAuth();
  const [status, setStatus] = useState<NotificationStatus>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Pasang observer foreground dan deep link
  useNotificationObserver();

  // Sinkronkan status izin saat aplikasi dimuat atau profil berubah
  const refresh = useCallback(async () => {
    if (!isPushNotificationSupported()) {
      setStatus('unsupported');
      setToken(null);
      return;
    }

    try {
      const currentStatus = await checkNotificationPermission();
      setStatus(currentStatus);

      if (currentStatus === 'granted') {
        const pushToken = await getExpoPushToken();
        setToken(pushToken);

        if (profile?.id && pushToken && profile?.expoPushToken !== pushToken) {
          await registerPushToken(profile.id, pushToken);
        }
      } else {
        setToken(null);
      }
      setLastError(null);
    } catch (err) {
      setStatus('error');
      setLastError(err instanceof Error ? err.message : 'Gagal memeriksa status notifikasi.');
    }
  }, [profile?.id, profile?.expoPushToken]);

  // Efek inisialisasi awal
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Pantau pembaruan token dari sistem
  useEffect(() => {
    if (!isPushNotificationSupported()) return;

    const subscription = Notifications.addPushTokenListener((tokenIdentifier) => {
      const newToken = tokenIdentifier.data;
      setToken(newToken);
      if (profile?.id && newToken) {
        void registerPushToken(profile.id, newToken);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [profile?.id]);

  // Mengaktifkan notifikasi saat diminta pengguna
  const enableNotifications = useCallback(async () => {
    if (!isPushNotificationSupported()) {
      setStatus('unsupported');
      return;
    }

    setStatus('requesting');
    setLastError(null);

    try {
      const resultStatus = await requestNotificationPermission();
      setStatus(resultStatus);

      if (resultStatus === 'granted') {
        const pushToken = await getExpoPushToken();
        if (pushToken) {
          setToken(pushToken);
          if (profile?.id) {
            await registerPushToken(profile.id, pushToken);
          }
        } else {
          setStatus('error');
          setLastError('Tidak dapat memperoleh token notifikasi dari perangkat.');
        }
      } else if (resultStatus === 'blocked') {
        setLastError('Izin notifikasi diblokir di pengaturan perangkat.');
      } else if (resultStatus === 'denied') {
        setLastError('Izin notifikasi ditolak.');
      }
    } catch (err) {
      setStatus('error');
      setLastError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengaktifkan notifikasi.');
    }
  }, [profile?.id]);

  // Membuka menu pengaturan aplikasi
  const openSettings = useCallback(async () => {
    try {
      await openNotificationSettings();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Gagal membuka pengaturan perangkat.');
    }
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      status,
      token,
      lastError,
      enableNotifications,
      openSettings,
      refresh,
    }),
    [status, token, lastError, enableNotifications, openSettings, refresh]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return safe fallback for testing or before provider mounts
    return {
      status: 'idle',
      token: null,
      lastError: null,
      enableNotifications: async () => {},
      openSettings: async () => {},
      refresh: async () => {},
    };
  }
  return context;
}
