/**
 * Hook untuk memantau respons notifikasi dan navigasi deep link (Sprint 3 - Dev 4).
 * Menangani banner foreground dan pengalihan ke rute terkait saat notifikasi diketuk.
 */

import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Konfigurasi bagaimana notifikasi ditampilkan saat aplikasi aktif di foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Validasi rute tujuan agar tidak membuka URL yang tidak dikenal atau berbahaya.
 */
function isValidInternalRoute(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  return (
    url.startsWith('/praktikan/presensi/') ||
    url.startsWith('/praktikan/sesi/') ||
    url.startsWith('/(praktikan)/izin') ||
    url.startsWith('/asisten/')
  );
}

/**
 * Mengarahkan navigasi ke rute dari payload notifikasi jika valid.
 */
function handleNotificationNavigation(data: Record<string, unknown> | undefined): void {
  if (!data) return;
  const targetUrl = data.url;

  if (isValidInternalRoute(targetUrl)) {
    // Navigasi ke rute yang ditentukan
    router.push(targetUrl as any);
  }
}

export function useNotificationObserver(): void {
  const handledLastResponseRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // 1. Tangani cold-start saat aplikasi dibuka dari ketukan notifikasi
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && !handledLastResponseRef.current) {
        handledLastResponseRef.current = true;
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        handleNotificationNavigation(data);
      }
    });

    // 2. Tangani ketukan notifikasi saat aplikasi berada di background
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      handleNotificationNavigation(data);
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);
}
