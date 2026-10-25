import { router, useLocalSearchParams } from 'expo-router';

import RecapScreen from '@/screens/asisten/recap-screen';

export default function RecapRoute() {
  const { sesi } = useLocalSearchParams<{ sesi?: string }>();
  return <RecapScreen key={sesi ?? 'all'} initialSessionId={sesi}
    onSchedule={() => router.dismissTo('/')}
    onDetail={id => router.push({ pathname: '/sesi/[id]', params: { id } })} />;
}
