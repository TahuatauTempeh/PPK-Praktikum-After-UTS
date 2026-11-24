/**
 * useSessionFirestore.ts – Dev 3
 * Hook untuk session-screen (asisten):
 *   - Realtime listener status sesi dari Firestore
 *   - Realtime listener rekap kehadiran dari Firestore
 *   - openSession / closeSession yang menulis ke Firestore
 *
 * Dipakai oleh SessionScreen dan layar Asisten untuk data Firestore realtime.
 */

import { useCallback, useEffect, useState } from 'react';

import { listenMyAttendance, listenSessionAttendance, type AttendanceDoc } from '@/lib/attendance-service';
import { closeSession, listenAllSessions, listenSession, openSession, type ActionResult, type FirestoreSession } from '@/lib/session-actions';
import type { UserProfile } from '@/types';

// ─── Realtime: Seluruh Sesi (untuk sinkronisasi jadwal Asisten & Praktikan) ───

export function useFirestoreSchedule() {
  const [firestoreSessions, setFirestoreSessions] = useState<FirestoreSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenAllSessions(
      (data) => {
        setFirestoreSessions(data);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return { firestoreSessions, loading, error };
}

// ─── Asisten: kelola satu sesi ────────────────────────────────────────────────

export interface UseSessionManageResult {
  session: FirestoreSession | null;
  loading: boolean;
  attendanceRecords: AttendanceDoc[];
  openSession: () => Promise<ActionResult>;
  closeSession: () => Promise<ActionResult>;
}

export function useSessionManage(sessionId: string): UseSessionManageResult {
  const [session, setSession] = useState<FirestoreSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceDoc[]>([]);

  // Realtime: status sesi
  useEffect(() => {
    const unsub = listenSession(sessionId, (data) => {
      setSession(data);
      setLoading(false);
    });
    return unsub;
  }, [sessionId]);

  // Realtime: rekap kehadiran
  useEffect(() => {
    const unsub = listenSessionAttendance(sessionId, setAttendanceRecords);
    return unsub;
  }, [sessionId]);

  const handleOpen = useCallback(() => openSession(sessionId), [sessionId]);
  const handleClose = useCallback(() => closeSession(sessionId), [sessionId]);

  return {
    session,
    loading,
    attendanceRecords,
    openSession: handleOpen,
    closeSession: handleClose,
  };
}

// ─── Praktikan: status presensi diri sendiri di satu sesi (baca saja) ───────
// Presensi dikirim dari halaman presensi lewat usePresensi, bukan dari hook ini.

export interface UseMyAttendanceResult {
  session: FirestoreSession | null;
  sessionLoading: boolean;
  myRecord: AttendanceDoc | null;
}

export function useMyAttendance(
  sessionId: string,
  profile: UserProfile | null,
): UseMyAttendanceResult {
  const [session, setSession] = useState<FirestoreSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [myRecord, setMyRecord] = useState<AttendanceDoc | null>(null);

  // Realtime: status sesi
  useEffect(() => {
    const unsub = listenSession(sessionId, (data) => {
      setSession(data);
      setSessionLoading(false);
    });
    return unsub;
  }, [sessionId]);

  // Realtime: status presensi saya
  useEffect(() => {
    if (!profile) return;
    const unsub = listenMyAttendance(sessionId, profile.id, setMyRecord);
    return unsub;
  }, [sessionId, profile]);

  return {
    session,
    sessionLoading,
    myRecord,
  };
}
