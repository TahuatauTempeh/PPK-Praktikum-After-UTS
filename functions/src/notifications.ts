/**
 * Cloud Functions Triggers untuk Push Notifications (Sprint 3 - Dev 4).
 * Mendengarkan perubahan sesi (sesi dibuka, jadwal berubah) dan peninjauan izin (disetujui, ditolak).
 * Region: asia-southeast2 (Jakarta), dilengkapi deduplikasi via notificationLogs.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import {
  handlePermissionReviewed,
  handleSessionUpdated,
} from './notification-handlers';

export {
  handlePermissionReviewed,
  handleSessionUpdated,
} from './notification-handlers';
export type {
  FirestoreUpdateEvent,
  SendPushMessages,
  SnapshotLike,
} from './notification-handlers';

const REGION = 'asia-southeast2';
const MAX_INSTANCES = 10;

/**
 * Trigger saat dokumen sesi diperbarui (sesi dibuka atau jadwal berubah).
 */
export const onSessionUpdated = onDocumentUpdated(
  {
    document: 'sessions/{sessionId}',
    region: REGION,
    maxInstances: MAX_INSTANCES,
    timeoutSeconds: 60,
  },
  async (event) => {
    await handleSessionUpdated(getFirestore(), event);
  }
);

/**
 * Trigger saat peninjauan izin diputuskan (disetujui atau ditolak).
 */
export const onPermissionReviewed = onDocumentUpdated(
  {
    document: 'permissionRequests/{requestId}',
    region: REGION,
    maxInstances: MAX_INSTANCES,
    timeoutSeconds: 60,
  },
  async (event) => {
    await handlePermissionReviewed(getFirestore(), event);
  }
);
