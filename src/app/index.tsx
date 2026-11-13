import { Redirect } from 'expo-router';
import React from 'react';

import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/auth-context';

export default function IndexScreen() {
  const { status, profile } = useAuth();

  if (status === 'loading') {
    return <LoadingState message="Memuat sesi..." />;
  }

  if (!profile) {
    return <Redirect href="/login" />;
  }

  return (
    <Redirect href={profile.role === 'asisten' ? '/asisten' : '/(praktikan)'} />
  );
}
