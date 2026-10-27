/**
 * Penjaga layar praktikan: tanpa user, kembali ke layar pertama root stack (pilih peran).
 * Tidak memakai href '/' karena ada tiga rute ber-URL '/' dan hasilnya ambigu.
 */

import { router } from 'expo-router';
import { useEffect } from 'react';

import { useSession } from '@/context/session-context';

// Jadwal dan Riwayat sama-sama ter-mount, jadi tanpa penanda ini dismissAll terpanggil dua kali
let sedangKeluar = false;

export function useUserPraktikan() {
  const user = useSession().state.currentUser;

  useEffect(() => {
    if (user || sedangKeluar || !router.canDismiss()) return;
    sedangKeluar = true;
    router.dismissAll();
    setTimeout(() => {
      sedangKeluar = false;
    }, 500);
  }, [user]);

  return user;
}
