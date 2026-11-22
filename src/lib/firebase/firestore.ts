import { getFirestore, type Firestore } from 'firebase/firestore';

import { getFirebaseApp } from './app';

let dbInstance: Firestore | null = null;

export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
}

export const COLLECTIONS = {
  users: 'users',
  classes: 'classes',
  enrollments: 'enrollments',
  sessions: 'sessions',
  attendance: 'attendance',
  permissionRequests: 'permissionRequests',
  auditLogs: 'auditLogs',
  laboratories: 'laboratories',
  notificationLogs: 'notificationLogs',
} as const;