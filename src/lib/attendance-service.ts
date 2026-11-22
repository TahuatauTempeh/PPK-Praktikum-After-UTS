/**
 * attendance-service.ts
 * Sprint 3: presensi berbasis lokasi lewat callable `submitAttendanceWithLocation`.
 * Realtime listeners untuk rekap asisten dan status presensi praktikan.
 * `submitAttendance` (tulis langsung Sprint 2) masih dipakai Detail Sesi dan
 * dihapus setelah Detail Sesi beralih ke halaman presensi.
 */

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';

import { getFunctions, httpsCallable } from 'firebase/functions';

import { hasilGagalDariGalat } from '@/lib/attendance-errors';
import type { DevicePosition } from '@/lib/device-location';
import { getFirebaseApp } from '@/lib/firebase/app';
import { logAction } from '@/lib/firebase/audit';
import { mapFirebaseError } from '@/lib/firebase/errors';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import type { AttendanceSubmitResult, UserProfile } from '@/types';

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
 * Kirim presensi ke callable `submitAttendance` (PRD 10.3). Server yang memvalidasi
 * dan menulis; klien tidak menulis `attendance`. Tidak ada retry otomatis dan tidak
 * ada antrean offline (BR-16): kegagalan dikembalikan agar pengguna mencoba lagi.
 *
 * `laboratoryName` hanya dipakai untuk pesan "di luar radius".
 */
export async function submitAttendanceWithLocation(
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

// ─── Submit presensi ──────────────────────────────────────────────────────────

/**
 * Catat kehadiran praktikan ke koleksi `attendance`.
 *
 * Doc ID = `{sessionId}_{uid}` → setDoc tanpa merge membuat duplikat langsung ditolak
 * oleh Firestore (error ALREADY_EXISTS).
 *
 * Guard tambahan di sisi klien:
 *  1. Sesi harus berstatus 'open'
 *  2. Belum ada doc dengan ID yang sama (presensi ganda)
 */
export async function submitAttendance(
  sessionId: string,
  profile: UserProfile,
): Promise<SubmitResult> {
  try {
    // Guard 1: cek status sesi
    const sessionSnap = await getDoc(doc(getDb(), COLLECTIONS.sessions, sessionId));
    if (!sessionSnap.exists()) {
      return { success: false, message: 'Sesi tidak ditemukan.' };
    }
    const sessionData = sessionSnap.data();
    if (sessionData.status !== 'open') {
      const statusMsg =
        sessionData.status === 'scheduled'
          ? 'Sesi belum dibuka oleh asisten.'
          : 'Sesi sudah ditutup, presensi tidak bisa dilakukan.';
      return { success: false, message: statusMsg };
    }

    // Guard 2: cek presensi ganda (klien-side, Firestore rules juga mencegah via create-only)
    const attendanceId = `${sessionId}_${profile.id}`;
    try {
      const existingSnap = await getDoc(doc(getDb(), COLLECTIONS.attendance, attendanceId));
      if (existingSnap.exists()) {
        return { success: false, message: 'Kamu sudah melakukan presensi di sesi ini.' };
      }
    } catch {
      // Abaikan jika pengecekan dokumen gagal (misal belum dibuat)
    }

    // Tulis dokumen presensi
    const payload: Omit<AttendanceDoc, 'id'> = {
      sessionId,
      userId: profile.id,
      userName: profile.name,
      userNim: profile.nim,
      recordedAt: serverTimestamp(),
    };

    await setDoc(doc(getDb(), COLLECTIONS.attendance, attendanceId), payload);

    await logAction(
      'SUBMIT_ATTENDANCE',
      COLLECTIONS.attendance,
      attendanceId,
      null,
      payload,
    );

    return { success: true, message: 'Presensi berhasil dicatat.' };
  } catch (err: unknown) {
    // Firestore menolak setDoc jika doc sudah ada (create-only rule) → tangkap sebagai duplikat
    if (err instanceof Error && err.message.includes('already exists')) {
      return { success: false, message: 'Kamu sudah melakukan presensi di sesi ini.' };
    }
    console.error('[attendance-service] submitAttendance gagal:', err);
    return { success: false, message: 'Gagal mencatat presensi. Coba lagi.' };
  }
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
