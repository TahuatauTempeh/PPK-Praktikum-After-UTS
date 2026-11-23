import { router } from 'expo-router';

import DaftarKesanPesan from '@/screens/asisten/kesan-pesan/daftar-kesan-pesan';

export default function DaftarKesanPesanRoute() {
  return (
    <DaftarKesanPesan
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten');
      }}
      onOpen={(sessionId) => router.push({ pathname: '/asisten/kesan-pesan/[sessionId]', params: { sessionId } })}
    />
  );
}
