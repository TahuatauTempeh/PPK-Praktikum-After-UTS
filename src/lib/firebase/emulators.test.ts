import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';

import {
  connectAuthEmulatorIfConfigured,
  connectFirestoreEmulatorIfConfigured,
} from './emulators';

jest.mock('firebase/auth', () => ({ connectAuthEmulator: jest.fn() }));
jest.mock('firebase/firestore', () => ({ connectFirestoreEmulator: jest.fn() }));

type AuthArg = Parameters<typeof connectAuthEmulator>[0];
type FirestoreArg = Parameters<typeof connectFirestoreEmulator>[0];

const originalHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;

afterEach(() => {
  if (originalHost === undefined) {
    delete process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
  } else {
    process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST = originalHost;
  }
  jest.clearAllMocks();
});

it('tidak menghubungkan emulator tanpa host', () => {
  delete process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
  const auth = {} as AuthArg;
  const db = {} as FirestoreArg;

  connectAuthEmulatorIfConfigured(auth);
  connectFirestoreEmulatorIfConfigured(db);

  expect(connectAuthEmulator).not.toHaveBeenCalled();
  expect(connectFirestoreEmulator).not.toHaveBeenCalled();
});

it('menghubungkan Auth dan Firestore ke port yang benar', () => {
  process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST = '127.0.0.1';
  const auth = {} as AuthArg;
  const db = {} as FirestoreArg;

  connectAuthEmulatorIfConfigured(auth);
  connectFirestoreEmulatorIfConfigured(db);

  expect(connectAuthEmulator).toHaveBeenCalledWith(
    auth,
    'http://127.0.0.1:9099',
    { disableWarnings: true },
  );
  expect(connectFirestoreEmulator).toHaveBeenCalledWith(db, '127.0.0.1', 8080);
});

it('idempoten untuk instance yang sama', () => {
  process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST = '127.0.0.1';
  const auth = {} as AuthArg;
  const db = {} as FirestoreArg;

  connectAuthEmulatorIfConfigured(auth);
  connectAuthEmulatorIfConfigured(auth);
  connectFirestoreEmulatorIfConfigured(db);
  connectFirestoreEmulatorIfConfigured(db);

  expect(connectAuthEmulator).toHaveBeenCalledTimes(1);
  expect(connectFirestoreEmulator).toHaveBeenCalledTimes(1);
});
