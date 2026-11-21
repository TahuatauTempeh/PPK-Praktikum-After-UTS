/**
 * Service notifikasi push untuk Presensi Praktikum (Sprint 3 - Dev 4).
 * Menangani izin notifikasi, pembuatan channel Android, pengambilan token Expo,
 * serta pendaftaran dan pencabutan token pada dokumen profil pengguna.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Linking, Platform } from 'react-native';

import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import type { NotificationStatus } from '@/types';

export const ANDROID_NOTIFICATION_CHANNEL_ID = 'praktikum';
export const DEFAULT_EAS_PROJECT_ID = '973698af-d649-4bb7-a583-4fbf399f00a2';

/**
 * Memeriksa apakah perangkat saat ini mendukung notifikasi push.
 * Notifikasi push tidak didukung pada web atau simulator tanpa dukungan push.
 */
export function isPushNotificationSupported(): boolean {
  if (Platform.OS === 'web') return false;
  return Device.isDevice;
}

/**
 * Mendapatkan projectId EAS untuk registrasi token Expo.
 */
export function getEasProjectId(): string {
  const configProjectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  return typeof configProjectId === 'string' && configProjectId.length > 0
    ? configProjectId
    : DEFAULT_EAS_PROJECT_ID;
}

/**
 * Menyiapkan Android Notification Channel "praktikum".
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID, {
    name: 'Praktikum',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#204CAC',
  });
}

/**
 * Memeriksa status izin notifikasi saat ini tanpa meminta popup izin ke pengguna.
 */
export async function checkNotificationPermission(): Promise<NotificationStatus> {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const settings = await Notifications.getPermissionsAsync();

    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return 'granted';
    }

    if (!settings.canAskAgain) {
      return 'blocked';
    }

    return 'denied';
  } catch {
    return 'error';
  }
}

/**
 * Meminta izin notifikasi kepada pengguna secara eksplisit.
 */
export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }

  try {
    await setupNotificationChannel();
    const settings = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return 'granted';
    }

    if (!settings.canAskAgain) {
      return 'blocked';
    }

    return 'denied';
  } catch {
    return 'error';
  }
}

/**
 * Mengambil token push Expo dari perangkat saat ini.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  const projectId = getEasProjectId();
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data ?? null;
}

/**
 * Menyimpan token push ke dokumen profil pengguna di Firestore.
 */
export async function registerPushToken(uid: string, token: string): Promise<void> {
  if (!uid || !token) return;

  const db = getDb();
  const userRef = doc(db, COLLECTIONS.users, uid);

  await updateDoc(userRef, {
    expoPushToken: token,
    pushPlatform: Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : null,
    pushUpdatedAt: serverTimestamp(),
  });
}

/**
 * Menghapus token push dari dokumen profil pengguna saat logout atau izin dicabut.
 */
export async function unregisterPushToken(uid: string): Promise<void> {
  if (!uid) return;

  const db = getDb();
  const userRef = doc(db, COLLECTIONS.users, uid);

  await updateDoc(userRef, {
    expoPushToken: null,
    pushPlatform: null,
    pushUpdatedAt: serverTimestamp(),
  });
}

/**
 * Membuka menu pengaturan aplikasi di sistem operasi perangkat.
 */
export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === 'web') return;

  if (await Linking.canOpenURL('app-settings:')) {
    await Linking.openURL('app-settings:');
    return;
  }

  await Linking.openSettings();
}
