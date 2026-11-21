/**
 * Cloud Functions Triggers untuk Push Notifications (Sprint 3 - Dev 4).
 * Mendengarkan perubahan sesi (sesi dibuka, jadwal berubah) dan peninjauan izin (disetujui, ditolak).
 * Region: asia-southeast2 (Jakarta), dilengkapi deduplikasi via notificationLogs.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import {
  ANDROID_CHANNEL_ID,
  buildDedupeKey,
  buildPermissionBody,
  buildScheduleChangedBody,
  buildSessionOpenBody,
  claimNotificationLog,
  cleanInvalidTokens,
  getClassName,
  getEnrolledPractikan,
  getSessionSummary,
  getUserPushToken,
  getUpdateTime,
  isScheduleChanged,
  sendExpoPushMessages,
  type ExpoPushMessage,
  type PushResult,
} from './notification-helpers';

const REGION = 'asia-southeast2';
const MAX_INSTANCES = 10;

interface SnapshotLike {
  data(): Record<string, unknown> | undefined;
  updateTime?: {
    toDate(): Date;
  };
}

export interface FirestoreUpdateEvent<TParams> {
  data?: {
    before: SnapshotLike;
    after: SnapshotLike;
  };
  params: TParams;
  time?: string;
}

type SendPushMessages = (messages: ExpoPushMessage[]) => Promise<PushResult>;

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Terjadi kesalahan saat memproses notifikasi.';
}

/**
 * Trigger saat dokumen sesi diperbarui (sesi dibuka atau jadwal berubah).
 * Diekspor terpisah agar bisa diuji tanpa Firebase runtime.
 */
export async function handleSessionUpdated(
  db: Firestore,
  event: FirestoreUpdateEvent<{ sessionId: string }>,
  send: SendPushMessages = sendExpoPushMessages
): Promise<void> {
  const change = event.data;
  if (!change) return;

  const before = change.before.data() ?? {};
  const after = change.after.data() ?? {};
  const sessionId = event.params.sessionId;

  let eventType: 'session-open' | 'session-schedule-changed' | null = null;

  if (before.status !== 'open' && after.status === 'open') {
    eventType = 'session-open';
  } else if (isScheduleChanged(before, after)) {
    eventType = 'session-schedule-changed';
  }

  if (!eventType) return;

  const updateTime = getUpdateTime(change.after, event.time);
  const dedupeKey = buildDedupeKey(eventType, sessionId, updateTime);
  const logRef = db.collection('notificationLogs').doc(dedupeKey);
  const claimed = await claimNotificationLog(db, logRef, {
    eventType,
    sourceCollection: 'sessions',
    sourceId: sessionId,
  });
  if (!claimed) return;

  let deliveryStarted = false;

  try {
    const classId = asString(after.classId) || asString(before.classId);
    const participants = await getEnrolledPractikan(db, classId);
    const recipientIds = participants.map((participant) => participant.uid);
    const validTokens = participants.filter(
      (participant): participant is { uid: string; token: string } =>
        Boolean(participant.token)
    );

    if (validTokens.length === 0) {
      await logRef.set(
        {
          recipientIds,
          successCount: 0,
          failureCount: 0,
          invalidTokens: [],
          status: 'skipped',
          error: null,
          completedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    const className = eventType === 'session-open' ? await getClassName(db, classId) : null;
    const title = asString(after.title).trim() || 'Praktikum';
    const startTime = asString(after.startTime);
    const endTime = asString(after.endTime);
    const room = asString(after.room);
    const body =
      eventType === 'session-open'
        ? buildSessionOpenBody({ title, className, startTime, endTime, room })
        : buildScheduleChangedBody({
            title,
            date: after.date,
            startTime,
            endTime,
            room,
          });
    const notificationTitle =
      eventType === 'session-open'
        ? 'Sesi praktikum dibuka'
        : 'Jadwal praktikum berubah';
    const url =
      eventType === 'session-open'
        ? `/praktikan/presensi/${sessionId}`
        : `/praktikan/sesi/${sessionId}`;

    const messages: ExpoPushMessage[] = validTokens.map(({ token }) => ({
      to: token,
      title: notificationTitle,
      body,
      sound: 'default',
      channelId: ANDROID_CHANNEL_ID,
      data: {
        type: eventType,
        sessionId,
        url,
      },
    }));

    deliveryStarted = true;
    const pushResult = await send(messages);

    let cleanupError: string | null = null;
    if (pushResult.invalidTokens.length > 0) {
      try {
        await cleanInvalidTokens(db, pushResult.invalidTokens);
      } catch (error) {
        cleanupError = errorMessage(error);
      }
    }

    const finalStatus =
      pushResult.successCount > 0
        ? pushResult.failureCount === 0
          ? 'sent'
          : 'partial'
        : 'failed';

    await logRef.set(
      {
        recipientIds,
        successCount: pushResult.successCount,
        failureCount: pushResult.failureCount,
        invalidTokens: pushResult.invalidTokens,
        status: finalStatus,
        error: cleanupError,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    const message = errorMessage(error);
    await logRef
      .set(
        {
          status: deliveryStarted ? 'processing' : 'failed',
          error: message,
          completedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      .catch(() => undefined);
    throw error;
  }
}

/**
 * Trigger saat peninjauan izin diputuskan (disetujui atau ditolak).
 * Diekspor terpisah agar bisa diuji tanpa Firebase runtime.
 */
export async function handlePermissionReviewed(
  db: Firestore,
  event: FirestoreUpdateEvent<{ requestId: string }>,
  send: SendPushMessages = sendExpoPushMessages
): Promise<void> {
  const change = event.data;
  if (!change) return;

  const before = change.before.data() ?? {};
  const after = change.after.data() ?? {};
  const requestId = event.params.requestId;

  let eventType: 'permission-approved' | 'permission-rejected' | null = null;

  if (before.status === 'pending' && after.status === 'approved') {
    eventType = 'permission-approved';
  } else if (before.status === 'pending' && after.status === 'rejected') {
    eventType = 'permission-rejected';
  }

  if (!eventType) return;

  const updateTime = getUpdateTime(change.after, event.time);
  const dedupeKey = buildDedupeKey(eventType, requestId, updateTime);
  const logRef = db.collection('notificationLogs').doc(dedupeKey);
  const claimed = await claimNotificationLog(db, logRef, {
    eventType,
    sourceCollection: 'permissionRequests',
    sourceId: requestId,
  });
  if (!claimed) return;

  let deliveryStarted = false;

  try {
    const userId = asString(after.userId) || asString(before.userId);
    const userTarget = await getUserPushToken(db, userId);
    const recipientIds = userId ? [userId] : [];

    if (!userTarget?.token) {
      await logRef.set(
        {
          recipientIds,
          successCount: 0,
          failureCount: 0,
          invalidTokens: [],
          status: 'skipped',
          error: null,
          completedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    const sessionId = asString(after.sessionId) || asString(before.sessionId);
    const session = await getSessionSummary(db, sessionId);
    const note = asString(after.reviewNote).trim() || null;
    const body = buildPermissionBody({
      approved: eventType === 'permission-approved',
      session,
      note,
    });
    const title =
      eventType === 'permission-approved' ? 'Izin disetujui' : 'Izin ditolak';

    const messages: ExpoPushMessage[] = [
      {
        to: userTarget.token,
        title,
        body,
        sound: 'default',
        channelId: ANDROID_CHANNEL_ID,
        data: {
          type: eventType,
          permissionId: requestId,
          url: '/(praktikan)/izin',
        },
      },
    ];

    deliveryStarted = true;
    const pushResult = await send(messages);

    let cleanupError: string | null = null;
    if (pushResult.invalidTokens.length > 0) {
      try {
        await cleanInvalidTokens(db, pushResult.invalidTokens);
      } catch (error) {
        cleanupError = errorMessage(error);
      }
    }

    await logRef.set(
      {
        recipientIds,
        successCount: pushResult.successCount,
        failureCount: pushResult.failureCount,
        invalidTokens: pushResult.invalidTokens,
        status: pushResult.successCount > 0 ? 'sent' : 'failed',
        error: cleanupError,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    const message = errorMessage(error);
    await logRef
      .set(
        {
          status: deliveryStarted ? 'processing' : 'failed',
          error: message,
          completedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      .catch(() => undefined);
    throw error;
  }
}

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
