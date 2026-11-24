/**
 * Route Peta untuk Asisten (Sprint 3 - Dev 3).
 */

import { router } from 'expo-router';
import React from 'react';

import { PetaScreen } from '@/screens/peta/peta-screen';

export default function PetaAsistenRoute() {
  return (
    <PetaScreen
      showBackButton
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/asisten'))}
    />
  );
}
