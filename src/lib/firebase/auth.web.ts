import { getAuth, type Auth } from 'firebase/auth';

import { getFirebaseApp } from './app';
import { connectAuthEmulatorIfConfigured } from './emulators';

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  connectAuthEmulatorIfConfigured(authInstance);
  return authInstance;
}
