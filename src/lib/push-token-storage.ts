/**
 * Penyimpanan lokal pemilik token push (Sprint 3 - Dev 4).
 * Dipakai untuk memastikan token hanya dihapus dari profil yang memang
 * memakai token perangkat ini, termasuk saat izin notifikasi dicabut.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@presensi/push-token-owner';

export interface PushTokenOwner {
  uid: string;
  token: string;
}

/** Menyimpan uid dan token Expo yang terakhir didaftarkan dari perangkat ini. */
export async function savePushTokenOwner(uid: string, token: string): Promise<void> {
  if (!uid || !token) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ uid, token }));
}

/** Mengambil pemilik token terakhir, atau null bila belum pernah disimpan. */
export async function getPushTokenOwner(): Promise<PushTokenOwner | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PushTokenOwner>;
    if (typeof parsed.uid !== 'string' || typeof parsed.token !== 'string') {
      return null;
    }

    return { uid: parsed.uid, token: parsed.token };
  } catch {
    return null;
  }
}

/** Menghapus catatan pemilik token dari perangkat. */
export async function clearPushTokenOwner(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best effort: kegagalan storage lokal tidak boleh menggagalkan logout.
  }
}
