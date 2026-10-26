/**
 * Penjaga layar praktikan: tanpa user, kembali ke layar pertama root stack (pilih peran).
 * Tidak memakai href '/' karena ada tiga rute ber-URL '/' dan hasilnya ambigu.
 */

import { router } from 'expo-router';
import { useEffect } from 'react';

import { useSession } from '@/context/session-context';

export function useUserPraktikan() {
  const user = useSession().state.currentUser;

  useEffect(() => {
    if (!user && router.canDismiss()) router.dismissAll();
  }, [user]);

  return user;
}
