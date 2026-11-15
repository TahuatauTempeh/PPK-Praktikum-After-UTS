import { router, useLocalSearchParams } from 'expo-router';

import ReviewIzin from '@/screens/asisten/izin/review-izin';

export default function ReviewIzinRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ReviewIzin
      id={id}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten/izin');
      }}
    />
  );
}
