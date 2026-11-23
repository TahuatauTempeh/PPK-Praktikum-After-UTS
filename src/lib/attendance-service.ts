/**
 * attendance-service.ts
 * Sprint 3: presensi berbasis lokasi lewat `submitAttendanceWithLocation`, yang memilih
 * jalur callable atau fallback transaksi (PRD 14.1) menurut `JALUR_PRESENSI`.
 * Realtime listeners untuk rekap asisten dan status presensi praktikan.
 */

import { collection, doc, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { hasilGagalDariGalat } from '@/lib/attendance-errors';
import { submitAttendanceViaTransaction, type ProfilPresensi } from '@/lib/attendance-fallback';
import type { DevicePosition } from '@/lib/device-location';
import { getFirebaseApp } from '@/lib/firebase/app';
import { mapFirebaseError } from '@/lib/firebase/errors';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import { toIsoString } from '@/lib/praktikum-helpers';
import type { AttendanceRecord, AttendanceSubmitResult } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AttendanceDoc {
  /** ID gabungan: `{sessionId}_{uid}` — mencegah presensi ganda di level DB */
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userNim: string;
  recordedAt: unknown; // Firestore Timestamp (serverTimestamp)
  // Bukti lokasi Sprint 3, ditulis callable. Catatan Sprint 2 tidak memilikinya.
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  distanceMeters?: number;
  radiusMeters?: number;
  laboratoryId?: string;
  mocked?: boolean;
  source?: string;
}

// ─── Sprint 3: presensi berbasis lokasi lewat callable ───────────────────────

/** Region callable, sama dengan `functions/src/attendance.ts` */
const FUNCTIONS_REGION = 'asia-southeast2';

interface SubmitAttendanceRequest {
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  mocked: boolean;
}

interface SubmitAttendanceResponse {
  attendanceId: string;
  recordedAt: string;
  distanceMeters: number;
  radiusMeters: number;
  laboratoryId: string;
  laboratoryName: string;
}

/**
 * Jalur pencatatan presensi.
 * - `fallback`: transaksi Firestore dari aplikasi (PRD 14.1). Dipakai selama project masih
 *   Spark, sesuai keputusan tim 23 November 2026. Jarak, akurasi, dan lokasi palsu hanya
 *   diperiksa di aplikasi; rules memeriksa sesi, enrollment, lab, dan bukti lokasi.
 * - `callable`: Cloud Function `submitAttendance`. Pakai setelah project Blaze, callable
 *   ter-deploy, dan rules `attendance` diubah menjadi `create: false`.
 *
 * Tidak ada retry otomatis dan tidak ada antrean offline (BR-16) di kedua jalur.
 */
export const JALUR_PRESENSI = 'fallback' as 'callable' | 'fallback';

/** `laboratoryName` hanya dipakai untuk pesan "di luar radius". */
export function submitAttendanceWithLocation(
  sessionId: string,
  position: DevicePosition,
  profile: ProfilPresensi,
  laboratoryName?: string,
): Promise<AttendanceSubmitResult> {
  return JALUR_PRESENSI === 'callable'
    ? submitAttendanceViaCallable(sessionId, position, laboratoryName)
    : submitAttendanceViaTransaction(sessionId, position, profile, laboratoryName);
}

/** Kirim ke callable `submitAttendance` (PRD 10.3); server yang memvalidasi dan menulis. */
export async function submitAttendanceViaCallable(
  sessionId: string,
  position: DevicePosition,
  laboratoryName?: string,
): Promise<AttendanceSubmitResult> {
  try {
    const kirim = httpsCallable<SubmitAttendanceRequest, SubmitAttendanceResponse>(
      getFunctions(getFirebaseApp(), FUNCTIONS_REGION),
      'submitAttendance',
    );
    const { data } = await kirim({
      sessionId,
      latitude: position.latitude,
      longitude: position.longitude,
      accuracyMeters: position.accuracyMeters,
      mocked: position.mocked,
    });
    return {
      ok: true,
      recordedAt: data.recordedAt,
      distanceMeters: data.distanceMeters,
      radiusMeters: data.radiusMeters,
    };
  } catch (error) {
    return hasilGagalDariGalat(error, laboratoryName);
  }
}

export interface SubmitResult {
  success: boolean;
  message: string;
}

/** Mengubah dokumen attendance Firestore menjadi record yang dipakai UI. */
export function toAttendanceRecord(doc: AttendanceDoc): AttendanceRecord {
  return {
    id: doc.id,
    sessionId: doc.sessionId,
    userId: doc.userId,
    userName: doc.userName,
    timestamp: toIsoString(doc.recordedAt) ?? '',
  };
}

/** Memfilter record milik satu praktikan dan memetakannya untuk UI. */
export function toAttendanceRecordsForUser(
  docs: readonly AttendanceDoc[],
  userId: string,
): AttendanceRecord[] {
  return docs.filter((doc) => doc.userId === userId).map(toAttendanceRecord);
}

// ─── Realtime: semua kehadiran milik satu praktikan ───────────────────────────

export function listenUserAttendance(
  userId: string,
  callback: (records: AttendanceDoc[]) => void,
): Unsubscribe {
  const q = query(
    collection(getDb(), COLLECTIONS.attendance),
    where('userId', '==', userId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AttendanceDoc);
      callback(records);
    },
    (err) => {
      console.warn('[listenUserAttendance] error:', err);
    },
  );
}

// ─── Realtime: semua kehadiran (untuk ringkasan jadwal asisten) ───────────────

export function listenAllAttendance(
  callback: (records: AttendanceDoc[]) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getDb(), COLLECTIONS.attendance),
    (snap) => {
      const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AttendanceDoc);
      callback(records);
    },
    (err) => {
      console.warn('[listenAllAttendance] error:', err);
    },
  );
}

// ─── Realtime: semua kehadiran dalam satu sesi (untuk rekap asisten) ──────────

export function listenSessionAttendance(
  sessionId: string,
  callback: (records: AttendanceDoc[]) => void,
): Unsubscribe {
  const q = query(
    collection(getDb(), COLLECTIONS.attendance),
    where('sessionId', '==', sessionId),
  );
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AttendanceDoc);
      callback(records);
    },
    (err) => {
      console.warn('[listenSessionAttendance] error:', err);
    },
  );
}

// ─── Realtime: status presensi satu praktikan di satu sesi ───────────────────

export function listenMyAttendance(
  sessionId: string,
  uid: string,
  callback: (record: AttendanceDoc | null) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const attendanceId = `${sessionId}_${uid}`;
  return onSnapshot(
    doc(getDb(), COLLECTIONS.attendance, attendanceId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as AttendanceDoc);
    },
    (err) => {
      console.warn('[listenMyAttendance] error:', err);
      onError?.(mapFirebaseError(err).message);
    },
  );
}
