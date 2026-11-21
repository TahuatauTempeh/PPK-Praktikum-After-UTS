/**
 * Cloud Functions Triggers untuk Push Notifications (Sprint 3 - Dev 4).
 * Mendengarkan perubahan sesi (sesi dibuka, jadwal berubah) dan peninjauan izin (disetujui, ditolak).
 * Region: asia-southeast2 (Jakarta), dilengkapi deduplikasi via notificationLogs.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

import {
  ANDROID_CHANNEL_ID,
  cleanInvalidTokens,
  getEnrolledPractikan,
  getUserPushToken,
  isScheduleChanged,
  sendExpoPushMessages,
  type ExpoPushMessage,
} from './notification-helpers';

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

    const db = getFirestore();
    const updateTime = event.time || new Date().toISOString();
    const dedupeKey = `${eventType}:${sessionId}:${updateTime}`;
    const logRef = db.collection('notificationLogs').doc(dedupeKey);

    // 1. Pemeriksaan Idempotensi / Deduplikasi
    const existingLog = await logRef.get();
    if (existingLog.exists && existingLog.data()?.status !== 'failed') {
      return;
    }

    await logRef.set(
      {
        eventType,
        sourceCollection: 'sessions',
        sourceId: sessionId,
        status: 'processing',
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Ambil penerima dari kelas sesi terkait
    const classId = after.classId || before.classId;
    const participants = await getEnrolledPractikan(db, classId);
    const recipientIds = participants.map((p) => p.uid);

    const validTokens = participants.filter((p): p is { uid: string; token: string } => Boolean(p.token));

    if (validTokens.length === 0) {
      await logRef.update({
        recipientIds,
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
        status: 'skipped',
        error: null,
        completedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    // 3. Susun isi pesan notifikasi
    let title = '';
    let body = '';
    let url = '';

    const sessionTitle = after.title || 'Praktikum';
    const timeStr = `${after.startTime || ''}–${after.endTime || ''}`;
    const roomStr = after.room || 'Laboratorium';

    if (eventType === 'session-open') {
      title = 'Sesi praktikum dibuka';
      body = `${sessionTitle} · ${timeStr} · ${roomStr}. Presensi sudah dibuka.`;
      url = `/praktikan/presensi/${sessionId}`;
    } else {
      title = 'Jadwal praktikum berubah';
      body = `${sessionTitle} — ${after.date || ''} (${timeStr}) · ${roomStr}.`;
      url = `/praktikan/sesi/${sessionId}`;
    }

    const messages: ExpoPushMessage[] = validTokens.map(({ token }) => ({
      to: token,
      title,
      body,
      sound: 'default',
      channelId: ANDROID_CHANNEL_ID,
      data: {
        type: eventType,
        sessionId,
        url,
      },
    }));

    // 4. Kirim notifikasi push ke Expo
    const pushResult = await sendExpoPushMessages(messages);

    // 5. Bersihkan token yang tidak valid
    if (pushResult.invalidTokens.length > 0) {
      await cleanInvalidTokens(db, pushResult.invalidTokens);
    }

    // 6. Catat hasil akhir ke log
    const finalStatus =
      pushResult.successCount > 0
        ? pushResult.failureCount === 0
          ? 'sent'
          : 'partial'
        : 'failed';

    await logRef.update({
      recipientIds,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
      invalidTokens: pushResult.invalidTokens,
      status: finalStatus,
      error: null,
      completedAt: FieldValue.serverTimestamp(),
    });
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

    const db = getFirestore();
    const updateTime = event.time || new Date().toISOString();
    const dedupeKey = `${eventType}:${requestId}:${updateTime}`;
    const logRef = db.collection('notificationLogs').doc(dedupeKey);

    // 1. Pemeriksaan Idempotensi / Deduplikasi
    const existingLog = await logRef.get();
    if (existingLog.exists && existingLog.data()?.status !== 'failed') {
      return;
    }

    await logRef.set(
      {
        eventType,
        sourceCollection: 'permissionRequests',
        sourceId: requestId,
        status: 'processing',
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 2. Ambil token pemilik izin
    const userId = after.userId || before.userId;
    const userTarget = await getUserPushToken(db, userId);
    const recipientIds = userId ? [userId] : [];

    if (!userTarget?.token) {
      await logRef.update({
        recipientIds,
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
        status: 'skipped',
        error: null,
        completedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    // 3. Susun isi pesan notifikasi
    let title = '';
    let body = '';
    const note = typeof after.reviewNote === 'string' && after.reviewNote.trim().length > 0
      ? after.reviewNote.trim()
      : null;

    if (eventType === 'permission-approved') {
      title = 'Izin disetujui';
      body = 'Pengajuan izin praktikum kamu telah disetujui oleh asisten.';
    } else {
      title = 'Izin ditolak';
      body = note
        ? `Pengajuan izin praktikum kamu ditolak: "${note}".`
        : 'Pengajuan izin praktikum kamu ditolak oleh asisten.';
    }

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

    // 4. Kirim notifikasi push ke Expo
    const pushResult = await sendExpoPushMessages(messages);

    // 5. Bersihkan token yang tidak valid
    if (pushResult.invalidTokens.length > 0) {
      await cleanInvalidTokens(db, pushResult.invalidTokens);
    }

    // 6. Catat hasil akhir ke log
    const finalStatus = pushResult.successCount > 0 ? 'sent' : 'failed';

    await logRef.update({
      recipientIds,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
      invalidTokens: pushResult.invalidTokens,
      status: finalStatus,
      error: null,
      completedAt: FieldValue.serverTimestamp(),
    });
  }
);
