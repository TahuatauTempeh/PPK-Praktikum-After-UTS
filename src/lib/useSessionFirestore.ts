/**
 * useSessionFirestore.ts – Dev 3
 * Hook untuk session-screen (asisten):
 *   - Realtime listener status sesi dari Firestore
 *   - Realtime listener rekap kehadiran dari Firestore
 *   - openSession / closeSession yang menulis ke Firestore
 *
 * Dipakai oleh SessionScreen sebagai pengganti useAssistantSessions()
 * untuk data yang terhubung ke Firestore.
 */

import { useCallback, useEffect, useState } from 'react';

import { listenMyAttendance, listenSessionAttendance, submitAttendance, type AttendanceDoc } from '@/lib/attendance-service';
import { closeSession, listenSession, openSession, type ActionResult, type FirestoreSession } from '@/lib/session-actions';
import type { UserProfile } from '@/types';

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

// ─── Praktikan: status presensi diri sendiri di satu sesi ────────────────────

export interface UseMyAttendanceResult {
  session: FirestoreSession | null;
  sessionLoading: boolean;
  myRecord: AttendanceDoc | null;
  submitting: boolean;
  submitResult: ActionResult | null;
  handleSubmitAttendance: () => Promise<void>;
}

export function useMyAttendance(
  sessionId: string,
  profile: UserProfile | null,
): UseMyAttendanceResult {
  const [session, setSession] = useState<FirestoreSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [myRecord, setMyRecord] = useState<AttendanceDoc | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ActionResult | null>(null);

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

  const handleSubmitAttendance = useCallback(async () => {
    if (!profile || submitting) return;
    setSubmitting(true);
    setSubmitResult(null);
    const result = await submitAttendance(sessionId, profile);
    setSubmitResult(result);
    setSubmitting(false);
  }, [profile, sessionId, submitting]);

  return {
    session,
    sessionLoading,
    myRecord,
    submitting,
    submitResult,
    handleSubmitAttendance,
  };
}
