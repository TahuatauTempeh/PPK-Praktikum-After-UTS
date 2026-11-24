import { connectAuthEmulator, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

type GlobalWithEmulators = typeof globalThis & {
  __PPK_FIREBASE_EMULATORS__?: WeakSet<object>;
};

function emulatorHost(): string | null {
  const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST?.trim();
  if (!host) return null;
  return host.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function connectedInstances(): WeakSet<object> {
  const global = globalThis as GlobalWithEmulators;
  global.__PPK_FIREBASE_EMULATORS__ ??= new WeakSet<object>();
  return global.__PPK_FIREBASE_EMULATORS__;
}

export function connectAuthEmulatorIfConfigured(auth: Auth): void {
  const host = emulatorHost();
  if (!host) return;

  const connected = connectedInstances();
  if (connected.has(auth)) return;

  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connected.add(auth);
}

export function connectFirestoreEmulatorIfConfigured(db: Firestore): void {
  const host = emulatorHost();
  if (!host) return;

  const connected = connectedInstances();
  if (connected.has(db)) return;

  connectFirestoreEmulator(db, host, 8080);
  connected.add(db);
}
