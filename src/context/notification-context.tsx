/**
 * Context dan Provider Notifikasi (Sprint 3 - Dev 4).
 * Mengelola siklus hidup status notifikasi, pendaftaran token, dan observer deep link.
 */

import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useNotificationObserver } from '@/hooks/use-notification-observer';
import {
  checkNotificationPermission,
  getExpoPushToken,
  isPushNotificationSupported,
  isPushTokenRegistrationPaused,
  openNotificationSettings,
  registerPushToken,
  requestNotificationPermission,
  setupNotificationChannel,
  unregisterPushTokenBestEffort,
} from '@/lib/notification-service';
import {
  clearPushTokenOwner,
  getPushTokenOwner,
  savePushTokenOwner,
} from '@/lib/push-token-storage';
import type { NotificationContextValue, NotificationStatus } from '@/types';

export { useNotificationObserver } from '@/hooks/use-notification-observer';

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { profile } = useAuth();
  const profileId = profile?.id;
  const profilePushToken = profile?.expoPushToken;

  const [status, setStatus] = useState<NotificationStatus>(() =>
    isPushNotificationSupported() ? 'idle' : 'unsupported'
  );
  const [token, setToken] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const operationCountRef = useRef(0);
  const refreshingRef = useRef(false);
  const requestingRef = useRef(false);

  // Pasang observer foreground dan deep link
  useNotificationObserver();

  /**
   * Menyinkronkan status izin dan token Expo. Status boleh diberikan langsung
   * setelah requestPermission agar tidak memeriksa izin dua kali.
   */
  const syncTokenState = useCallback(
    async (opId: number, knownStatus?: NotificationStatus) => {
      if (isPushTokenRegistrationPaused()) return;

      try {
        const currentStatus = knownStatus ?? (await checkNotificationPermission());
        if (opId !== operationCountRef.current) return;

        if (currentStatus !== 'granted') {
          setStatus(currentStatus);
          setToken(null);
          setLastError(null);

          let owner: Awaited<ReturnType<typeof getPushTokenOwner>> = null;
          try {
            owner = await getPushTokenOwner();
          } catch {
            owner = null;
          }

          if (
            profileId &&
            profilePushToken &&
            owner?.uid === profileId &&
            owner.token === profilePushToken
          ) {
            try {
              await unregisterPushTokenBestEffort(profileId);
              await clearPushTokenOwner();
            } catch {
              // Best effort: status izin tetap ditampilkan meskipun cleanup gagal.
            }
          }
          return;
        }

        const pushToken = await getExpoPushToken();
        if (opId !== operationCountRef.current) return;

        if (!pushToken) {
          setToken(null);
          setStatus('error');
          setLastError('Token notifikasi belum tersedia. Coba lagi.');
          return;
        }

        setToken(pushToken);

        if (profileId && !isPushTokenRegistrationPaused()) {
          if (profilePushToken !== pushToken) {
            await registerPushToken(profileId, pushToken);
          }
          try {
            await savePushTokenOwner(profileId, pushToken);
          } catch {
            // Storage lokal hanya untuk cleanup; kegagalannya tidak mematikan notifikasi.
          }
        }

        if (opId !== operationCountRef.current || isPushTokenRegistrationPaused()) return;
        setStatus('granted');
        setLastError(null);
      } catch (err) {
        if (opId !== operationCountRef.current) return;
        setStatus('error');
        setLastError(err instanceof Error ? err.message : 'Gagal memeriksa status notifikasi.');
      }
    },
    [profileId, profilePushToken]
  );

  const refresh = useCallback(async () => {
    if (!isPushNotificationSupported()) {
      setStatus('unsupported');
      setToken(null);
      setLastError(null);
      return;
    }

    if (requestingRef.current || refreshingRef.current) return;
    if (isPushTokenRegistrationPaused()) return;

    refreshingRef.current = true;
    try {
      await syncTokenState(++operationCountRef.current);
    } finally {
      refreshingRef.current = false;
    }
  }, [syncTokenState]);

  // Siapkan channel Android sejak awal, termasuk untuk Android <= 12 yang izinnya sudah granted.
  useEffect(() => {
    if (!isPushNotificationSupported()) return;
    void setupNotificationChannel().catch(() => undefined);
  }, []);

  // Sinkronkan status saat provider pertama kali dipasang atau profil berubah.
  // Ditunda satu tick agar setState tidak terjadi langsung di body effect.
  useEffect(() => {
    if (!isPushNotificationSupported()) return;
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  // Refresh saat pengguna kembali dari pengaturan sistem atau membuka aplikasi lagi.
  useEffect(() => {
    if (!isPushNotificationSupported()) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  // Listener ini membawa DevicePushToken (FCM/APNs mentah). Jangan menyimpannya
  // langsung; ambil ulang ExpoPushToken lewat refresh().
  useEffect(() => {
    if (!isPushNotificationSupported()) return;
    const subscription = Notifications.addPushTokenListener(() => {
      void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  // Mengaktifkan notifikasi saat diminta pengguna
  const enableNotifications = useCallback(async () => {
    if (!isPushNotificationSupported()) {
      setStatus('unsupported');
      return;
    }
    if (requestingRef.current) return;
    if (isPushTokenRegistrationPaused()) return;

    const opId = ++operationCountRef.current;
    requestingRef.current = true;
    setStatus('requesting');
    setLastError(null);

    try {
      const resultStatus = await requestNotificationPermission();
      if (opId !== operationCountRef.current) return;

      // Gunakan status hasil request agar tidak memeriksa izin dua kali.
      await syncTokenState(opId, resultStatus);

      if (resultStatus === 'blocked') {
        setLastError('Izin notifikasi diblokir di pengaturan perangkat.');
      } else if (resultStatus === 'denied') {
        setLastError('Izin notifikasi ditolak.');
      } else if (resultStatus === 'error') {
        setLastError('Terjadi kesalahan saat mengaktifkan notifikasi.');
      }
    } catch (err) {
      if (opId !== operationCountRef.current) return;
      setStatus('error');
      setLastError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengaktifkan notifikasi.');
    } finally {
      requestingRef.current = false;
    }
  }, [syncTokenState]);

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
