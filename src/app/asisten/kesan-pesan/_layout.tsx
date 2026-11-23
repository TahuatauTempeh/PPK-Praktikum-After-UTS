import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/auth-context';

/**
 * Halaman kesan pesan asisten berada di luar Stack.Protected root, jadi penjagaan peran dilakukan
 * di sini (pola yang sama dengan halaman izin) agar src/app/_layout.tsx milik Dev 1 tidak berubah.
 */
export default function KesanPesanAsistenLayout() {
  const { profile } = useAuth();

  if (profile?.role !== 'asisten') {
    return <Redirect href={profile ? '/(praktikan)' : '/login'} />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
