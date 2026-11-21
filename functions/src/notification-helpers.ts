/**
 * Helper pengiriman push notification dan deduplikasi untuk Cloud Functions (Sprint 3 - Dev 4).
 * Menangani Expo Push Service batching (maks 100 per request), penerima berdasarkan kelas/enrollment,
 * pencatatan audit notificationLogs, dan pembersihan token tidak valid (DeviceNotRegistered).
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
export const MAX_EXPO_BATCH_SIZE = 100;
export const ANDROID_CHANNEL_ID = 'praktikum';

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  channelId?: string;
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

export interface PushResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

/**
 * Membagi array menjadi potongan-potongan kecil (chunk) dengan ukuran maksimum tertentu.
 */
export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Mengirim batch notifikasi push ke Expo Push Service.
 */
export async function sendExpoPushMessages(messages: ExpoPushMessage[]): Promise<PushResult> {
  if (messages.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const chunks = chunkArray(messages, MAX_EXPO_BATCH_SIZE);
  let totalSuccess = 0;
  let totalFailure = 0;
  const invalidTokens: string[] = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!response.ok) {
        totalFailure += chunk.length;
        continue;
      }

      const responseData = (await response.json()) as { data?: ExpoPushTicket[] };
      const tickets = responseData.data ?? [];

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const token = chunk[i]?.to;

        if (ticket.status === 'ok') {
          totalSuccess++;
        } else {
          totalFailure++;
          if (ticket.details?.error === 'DeviceNotRegistered' && token) {
            invalidTokens.push(token);
          }
        }
      }
    } catch {
      totalFailure += chunk.length;
    }
  }

  return {
    successCount: totalSuccess,
    failureCount: totalFailure,
    invalidTokens,
  };
}

/**
 * Membersihkan token yang sudah tidak aktif (DeviceNotRegistered) dari koleksi users.
 */
export async function cleanInvalidTokens(db: Firestore, invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) return;

  const chunks = chunkArray(invalidTokens, 30);
  for (const chunk of chunks) {
    const snapshot = await db.collection('users').where('expoPushToken', 'in', chunk).get();
    const batch = db.batch();

    for (const doc of snapshot.docs) {
      batch.update(doc.ref, {
        expoPushToken: null,
        pushPlatform: null,
        pushUpdatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  }
}

/**
 * Mengambil token pengguna yang terdaftar di suatu kelas melalui koleksi enrollments.
 */
export async function getEnrolledPractikan(
  db: Firestore,
  classId: string
): Promise<Array<{ uid: string; token: string | null }>> {
  if (!classId) return [];

  const enrollmentsSnap = await db.collection('enrollments').where('classId', '==', classId).get();
  if (enrollmentsSnap.empty) return [];

  const userIds = enrollmentsSnap.docs.map((d) => d.data().userId).filter(Boolean);
  if (userIds.length === 0) return [];

  const userChunks = chunkArray(userIds, 30);
  const results: Array<{ uid: string; token: string | null }> = [];

  for (const chunk of userChunks) {
    const usersSnap = await db
      .collection('users')
      .where(FieldPathDocumentId(), 'in', chunk)
      .get();

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      results.push({
        uid: userDoc.id,
        token: typeof data.expoPushToken === 'string' ? data.expoPushToken : null,
      });
    }
  }

  return results;
}

/**
 * Mengambil token satu pengguna berdasarkan UID (untuk izin praktikum).
 */
export async function getUserPushToken(
  db: Firestore,
  uid: string
): Promise<{ uid: string; token: string | null } | null> {
  if (!uid) return null;

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return null;

  const data = userDoc.data() ?? {};
  return {
    uid,
    token: typeof data.expoPushToken === 'string' ? data.expoPushToken : null,
  };
}

/**
 * Memeriksa apakah terjadi perubahan jadwal yang relevan pada sesi.
 */
export function isScheduleChanged(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): boolean {
  // Bila ini transisi status ke open, bukan schedule changed tapi session-open
  if (before.status !== 'open' && after.status === 'open') {
    return false;
  }

  const fieldsToCheck = [
    'date',
    'startTime',
    'endTime',
    'room',
    'title',
    'laboratoryId',
    'classId',
  ];

  return fieldsToCheck.some((f) => before[f] !== after[f]);
}

/**
 * Helper internal untuk FieldPath document ID
 */
function FieldPathDocumentId() {
  const { FieldPath } = require('firebase-admin/firestore');
  return FieldPath.documentId();
}
