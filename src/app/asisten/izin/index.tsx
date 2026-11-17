import { router } from 'expo-router';

import DaftarIzin from '@/screens/asisten/izin/daftar-izin';

export default function DaftarIzinRoute() {
  return (
    <DaftarIzin
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten');
      }}
      onOpen={id => router.push({ pathname: '/asisten/izin/[id]', params: { id } })}
    />
  );
}
