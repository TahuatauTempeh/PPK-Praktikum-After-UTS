/**
 * Helper pengiriman push notification dan deduplikasi untuk Cloud Functions (Sprint 3 - Dev 4).
 * Menangani Expo Push Service batching (maks 100 per request), penerima berdasarkan kelas/enrollment,
 * pencatatan audit notificationLogs, dan pembersihan token tidak valid (DeviceNotRegistered).
 */

import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';

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

export interface SessionSummary {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface NotificationLogClaim {
  eventType: string;
  sourceCollection: 'sessions' | 'permissionRequests';
  sourceId: string;
}

interface SnapshotWithUpdateTime {
  updateTime?: {
    toDate(): Date;
  };
}

/**
 * Membagi array menjadi potongan-potongan kecil (chunk) dengan ukuran maksimum tertentu.
 */
export function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [];

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
  const uniqueTokens = Array.from(
    new Set(invalidTokens.filter((token) => typeof token === 'string' && token.length > 0))
  );
  if (uniqueTokens.length === 0) return;

  const chunks = chunkArray(uniqueTokens, 30);
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
): Promise<{ uid: string; token: string | null }[]> {
  if (!classId) return [];

  const enrollmentsSnap = await db.collection('enrollments').where('classId', '==', classId).get();
  if (enrollmentsSnap.empty) return [];

  const userIds = Array.from(
    new Set(
      enrollmentsSnap.docs
        .map((doc) => doc.data().userId)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  );
  if (userIds.length === 0) return [];

  const userChunks = chunkArray(userIds, 30);
  const results: { uid: string; token: string | null }[] = [];

  for (const chunk of userChunks) {
    const usersSnap = await db
      .collection('users')
      .where(FieldPath.documentId(), 'in', chunk)
      .get();

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data() ?? {};
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
 * Mengambil nama kelas untuk isi notifikasi. Null bila kelas tidak ada.
 */
export async function getClassName(db: Firestore, classId: string): Promise<string | null> {
  if (!classId) return null;

  try {
    const snapshot = await db.collection('classes').doc(classId).get();
    if (!snapshot.exists) return null;

    const name = snapshot.data()?.name;
    return typeof name === 'string' && name.trim() ? name.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Mengambil ringkasan sesi untuk notifikasi izin. Null bila sesi tidak ada.
 */
export async function getSessionSummary(
  db: Firestore,
  sessionId: string
): Promise<SessionSummary | null> {
  if (!sessionId) return null;

  try {
    const snapshot = await db.collection('sessions').doc(sessionId).get();
    if (!snapshot.exists) return null;

    const data = snapshot.data() ?? {};
    return {
      title: typeof data.title === 'string' ? data.title.trim() : '',
      date: formatSessionDate(data.date),
      startTime: typeof data.startTime === 'string' ? data.startTime : '',
      endTime: typeof data.endTime === 'string' ? data.endTime : '',
    };
  } catch {
    return null;
  }
}

function formatTimeRange(startTime: string, endTime: string): string {
  if (startTime && endTime) return `${startTime}–${endTime}`;
  return startTime || endTime;
}

/**
 * Menormalkan tanggal sesi ke YYYY-MM-DD, termasuk dokumen lama berisi Timestamp.
 */
export function formatSessionDate(value: unknown): string {
  if (typeof value === 'string') return value.trim();

  if (value && typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date };
    if (typeof timestamp.toDate === 'function') {
      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(timestamp.toDate());
      } catch {
        return '';
      }
    }
  }

  return '';
}

/**
 * Body notifikasi sesi dibuka: judul, kelas, waktu, ruang.
 */
export function buildSessionOpenBody(input: {
  title: string;
  className?: string | null;
  startTime?: string;
  endTime?: string;
  room?: string;
}): string {
  const title = input.title.trim() || 'Praktikum';
  const className = input.className?.trim();
  const head = className ? `${title} — ${className}` : title;
  const time = formatTimeRange(input.startTime ?? '', input.endTime ?? '');
  const details = [time, input.room?.trim()].filter(
    (part): part is string => typeof part === 'string' && part.length > 0
  );

  return `${head}${details.length > 0 ? ` · ${details.join(' · ')}` : ''}. Presensi sudah dibuka.`;
}

/**
 * Body notifikasi perubahan jadwal.
 */
export function buildScheduleChangedBody(input: {
  title: string;
  date?: unknown;
  startTime?: string;
  endTime?: string;
  room?: string;
}): string {
  const title = input.title.trim() || 'Praktikum';
  const date = formatSessionDate(input.date);
  const head = date ? `${title} — ${date}` : title;
  const time = formatTimeRange(input.startTime ?? '', input.endTime ?? '');
  const details = [time ? `(${time})` : '', input.room?.trim()].filter(
    (part): part is string => typeof part === 'string' && part.length > 0
  );

  return `${head}${details.length > 0 ? ` ${details.join(' · ')}` : ''}.`;
}

/**
 * Body notifikasi keputusan izin, memuat nama dan waktu sesi bila tersedia.
 */
export function buildPermissionBody(input: {
  approved: boolean;
  session: SessionSummary | null;
  note?: string | null;
}): string {
  let label = 'Sesi praktikum';

  if (input.session) {
    const parts = [input.session.title.trim() || 'Praktikum'];
    if (input.session.date) parts.push(input.session.date);

    label = parts.join(' — ');
    const time = formatTimeRange(input.session.startTime, input.session.endTime);
    if (time) label += ` (${time})`;
  }

  const note = input.note?.trim();
  const suffix = input.approved
    ? 'Pengajuan izin kamu disetujui.'
    : `Pengajuan izin kamu ditolak${note ? `: "${note}"` : ''}.`;

  return `${label}. ${suffix}`;
}

/**
 * Kunci dedupe memakai versi dokumen Firestore agar retry tidak mengirim ganda.
 */
export function buildDedupeKey(
  eventType: string,
  sourceId: string,
  updateTime: string
): string {
  return `${eventType}:${sourceId}:${updateTime}`;
}

/**
 * Mengambil waktu update dokumen (stabil antar retry), dengan fallback event time.
 */
export function getUpdateTime(
  snapshot: SnapshotWithUpdateTime,
  eventTime?: string
): string {
  try {
    if (snapshot.updateTime) {
      return snapshot.updateTime.toDate().toISOString();
    }
  } catch {
    // Fallback ke event time bila Timestamp tidak bisa dibaca.
  }

  return eventTime ?? new Date().toISOString();
}

/**
 * Mengklaim kunci dedupe secara atomik. Status failed boleh dicoba ulang.
 */
export async function claimNotificationLog(
  db: Firestore,
  logRef: DocumentReference,
  claim: NotificationLogClaim
): Promise<boolean> {
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(logRef);
    const currentStatus = snapshot.data()?.status;

    if (snapshot.exists && currentStatus !== 'failed') {
      return false;
    }

    transaction.set(
      logRef,
      {
        ...claim,
        status: 'processing',
        recipientIds: [],
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
        error: null,
        createdAt: FieldValue.serverTimestamp(),
        completedAt: null,
      },
      { merge: true }
    );

    return true;
  });
}

function toMillis(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();

  if (value && typeof value === 'object') {
    const candidate = value as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
    };

    if (typeof candidate.toMillis === 'function') {
      try {
        return candidate.toMillis();
      } catch {
        return null;
      }
    }

    if (typeof candidate.toDate === 'function') {
      try {
        return candidate.toDate().getTime();
      } catch {
        return null;
      }
    }

    if (typeof candidate.seconds === 'number') {
      return candidate.seconds * 1000;
    }
  }

  return null;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  const aMillis = toMillis(a);
  const bMillis = toMillis(b);
  if (aMillis !== null && bMillis !== null) return aMillis === bMillis;

  return false;
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

  return fieldsToCheck.some((field) => !valuesEqual(before[field], after[field]));
}
