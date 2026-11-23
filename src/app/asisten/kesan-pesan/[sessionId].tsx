import { router, useLocalSearchParams } from 'expo-router';

import KesanPesanPerSesi from '@/screens/asisten/kesan-pesan/kesan-pesan-per-sesi';

export default function KesanPesanPerSesiRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return (
    <KesanPesanPerSesi
      sessionId={sessionId}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten/kesan-pesan');
      }}
    />
  );
}
