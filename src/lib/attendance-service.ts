/**
 * attendance-service.ts – Dev 3
 * Submit presensi ke Firestore dengan pencegahan presensi ganda,
 * dan realtime listeners untuk rekap asisten & status praktikan.
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

import { logAction } from '@/lib/firebase/audit';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import { toIsoString } from '@/lib/praktikum-helpers';
import type { AttendanceRecord, UserProfile } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AttendanceDoc {
  /** ID gabungan: `{sessionId}_{uid}` — mencegah presensi ganda di level DB */
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userNim: string;
  recordedAt: unknown; // Firestore Timestamp (serverTimestamp)
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
    },
  );
}
