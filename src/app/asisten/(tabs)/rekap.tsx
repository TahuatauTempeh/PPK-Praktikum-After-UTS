import { router, useLocalSearchParams } from 'expo-router';

import RecapScreen from '@/screens/asisten/recap-screen';

export default function RecapRoute() {
  const { sesi } = useLocalSearchParams<{ sesi?: string }>();
  return (
    <RecapScreen
      key={sesi ?? 'all'}
      initialSessionId={sesi}
      onSchedule={() => router.navigate('/asisten/jadwal')}
      onDetail={id => router.push({ pathname: '/asisten/sesi/[id]', params: { id } })}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten');
      }}
    />
  );
}
