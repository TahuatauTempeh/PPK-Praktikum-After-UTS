import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/auth-context';

/**
 * Halaman izin asisten berada di luar Stack.Protected root, jadi penjagaan peran dilakukan di sini
 * agar src/app/_layout.tsx milik Dev 1 tidak perlu diubah.
 */
export default function IzinAsistenLayout() {
  const { profile } = useAuth();

  if (profile?.role !== 'asisten') {
    return <Redirect href={profile ? '/(praktikan)' : '/login'} />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
