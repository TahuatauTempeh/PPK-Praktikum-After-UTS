import { router, useLocalSearchParams } from 'expo-router';

import SessionScreen from '@/screens/asisten/session-screen';

export default function SessionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SessionScreen id={id} onBack={() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }} />;
}
