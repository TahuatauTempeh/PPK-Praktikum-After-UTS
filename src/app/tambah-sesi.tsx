import { router } from 'expo-router';

import AddSessionScreen from '@/screens/asisten/add-session-screen';

export default function AddSessionRoute() {
  return <AddSessionScreen onCancel={() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }} onSaved={session => router.dismissTo({ pathname: '/', params: { tanggal: session.date, baru: session.id } })} />;
}
