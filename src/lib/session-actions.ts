/**
 * session-actions.ts – Dev 3, guard laboratorium oleh Dev 1 (Sprint 3)
 * Aksi buka/tutup sesi dengan audit log ke Firestore.
 * Sesi tanpa laboratorium aktif tidak dapat dibuka (BR-10).
 * Hanya asisten yang boleh memanggil fungsi ini (enforced oleh Security Rules di Firestore).
 */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore';

import { logAction } from '@/lib/firebase/audit';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import type { SessionStatus } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FirestoreSession {
  id: string;
  classId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  assistantId: string;
  status: SessionStatus;
  /** Kosong atau tidak ada pada sesi lama (Sprint 2): sesi tidak boleh dibuka. */
  laboratoryId?: string;
  createdAt: unknown;
  openedAt?: unknown;
  closedAt?: unknown;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchSession(sessionId: string): Promise<FirestoreSession | null> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.sessions, sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FirestoreSession;
}

export const LAB_REQUIRED_MESSAGE = 'Lengkapi laboratorium sesi terlebih dahulu.';
export const LAB_INACTIVE_MESSAGE =
  'Laboratorium sesi tidak aktif. Aktifkan laboratorium atau pilih laboratorium lain.';

// ─── Buka sesi (scheduled → open) ────────────────────────────────────────────

export async function openSession(sessionId: string): Promise<ActionResult> {
  try {
    const session = await fetchSession(sessionId);

    if (!session) {
      return { success: false, message: 'Sesi tidak ditemukan.' };
    }
    if (session.status !== 'scheduled') {
      return {
        success: false,
        message: `Sesi tidak bisa dibuka (status saat ini: ${session.status}).`,
      };
    }

    if (typeof session.laboratoryId !== 'string' || session.laboratoryId.trim() === '') {
      return { success: false, message: LAB_REQUIRED_MESSAGE };
    }

    const laboratorySnapshot = await getDoc(
      doc(getDb(), COLLECTIONS.laboratories, session.laboratoryId)
    );
    if (!laboratorySnapshot.exists() || laboratorySnapshot.data()?.isActive !== true) {
      return { success: false, message: LAB_INACTIVE_MESSAGE };
    }

    const before = { status: session.status };
    const after = { status: 'open' as SessionStatus };

    await updateDoc(doc(getDb(), COLLECTIONS.sessions, sessionId), {
      status: 'open',
      openedAt: serverTimestamp(),
    });

    await logAction('OPEN_SESSION', COLLECTIONS.sessions, sessionId, before, after);

    return { success: true, message: 'Sesi berhasil dibuka.' };
  } catch (err) {
    console.error('[session-actions] openSession gagal:', err);
    return { success: false, message: 'Gagal membuka sesi. Coba lagi.' };
  }
}

// ─── Tutup sesi (open → closed) ──────────────────────────────────────────────

export async function closeSession(sessionId: string): Promise<ActionResult> {
  try {
    const session = await fetchSession(sessionId);

    if (!session) {
      return { success: false, message: 'Sesi tidak ditemukan.' };
    }
    if (session.status !== 'open') {
      return {
        success: false,
        message: `Sesi tidak bisa ditutup (status saat ini: ${session.status}).`,
      };
    }

    const before = { status: session.status };
    const after = { status: 'closed' as SessionStatus };

    await updateDoc(doc(getDb(), COLLECTIONS.sessions, sessionId), {
      status: 'closed',
      closedAt: serverTimestamp(),
    });

    await logAction('CLOSE_SESSION', COLLECTIONS.sessions, sessionId, before, after);

    return { success: true, message: 'Sesi berhasil ditutup.' };
  } catch (err) {
    console.error('[session-actions] closeSession gagal:', err);
    return { success: false, message: 'Gagal menutup sesi. Coba lagi.' };
  }
}

// ─── Ambil satu sesi (satu kali baca) ────────────────────────────────────────

export async function getSession(sessionId: string): Promise<FirestoreSession | null> {
  return fetchSession(sessionId);
}

// ─── Realtime listener: semua sesi milik asisten di kelas tertentu ────────────

export function listenSessionsByClass(
  classId: string,
  callback: (sessions: FirestoreSession[]) => void,
): Unsubscribe {
  const q = query(
    collection(getDb(), COLLECTIONS.sessions),
    where('classId', '==', classId),
    orderBy('date', 'asc'),
    orderBy('startTime', 'asc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreSession);
      callback(sessions);
    },
    (err) => {
      console.warn('[listenSessionsByClass] error:', err);
    },
  );
}

// ─── Realtime listener: satu sesi (untuk status updates) ─────────────────────

export function listenSession(
  sessionId: string,
  callback: (session: FirestoreSession | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), COLLECTIONS.sessions, sessionId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as FirestoreSession);
    },
    (err) => {
      console.warn('[listenSession] error:', err);
    },
  );
}

// ─── Realtime listener: seluruh sesi (untuk sinkronisasi jadwal) ─────────────

export function listenAllSessions(
  callback: (sessions: FirestoreSession[]) => void,
): Unsubscribe {
  const q = collection(getDb(), COLLECTIONS.sessions);
  return onSnapshot(
    q,
    (snap) => {
      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirestoreSession);
      callback(sessions);
    },
    (err) => {
      console.warn('[listenAllSessions] error:', err);
    },
  );
}

