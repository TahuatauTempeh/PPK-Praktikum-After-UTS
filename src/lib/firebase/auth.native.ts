import * as FirebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFirebaseApp } from './app';
import { connectAuthEmulatorIfConfigured } from './emulators';

const getReactNativePersistence = (
  FirebaseAuth as unknown as {
    getReactNativePersistence: (storage: unknown) => FirebaseAuth.Persistence;
  }
).getReactNativePersistence;

let authInstance: FirebaseAuth.Auth | null = null;

export function getFirebaseAuth(): FirebaseAuth.Auth {
  if (authInstance) {
    connectAuthEmulatorIfConfigured(authInstance);
    return authInstance;
  }

  const app = getFirebaseApp();

  try {
    authInstance = FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'auth/already-initialized') {
      authInstance = FirebaseAuth.getAuth(app);
    } else {
      throw error;
    }
  }

  connectAuthEmulatorIfConfigured(authInstance);
  return authInstance;
}
