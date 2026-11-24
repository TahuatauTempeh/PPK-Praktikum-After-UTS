/**
 * Data layer Firestore untuk layar Asisten (beranda, jadwal, rekap).
 *
 * Satu sumber listener dipakai bersama supaya jadwal, rekap, dan detail sesi
 * tidak saling berbeda. Preview provider tidak lagi dipakai.
 */

import { useEffect, useMemo, useState } from 'react';

import { listenAllAttendance, type AttendanceDoc } from '@/lib/attendance-service';
import { listenAllClasses } from '@/lib/class-service';
import { listenAllEnrollments } from '@/lib/enrollment-service';
import { useFirestoreSchedule } from '@/lib/useSessionFirestore';
import type { Enrollment } from '@/types';

import { keSesiAsisten, pilihTanggalAktif, tanggalHariIniWIB } from './jadwal-aktif';
import {
  buildAssistantAttendance,
  buildAssistantParticipants,
  buildAssistantSessions,
} from './schedule-mapping';
import type {
  AssistantAttendance,
  AssistantParticipant,
  AssistantSession,
} from './schedule-data';

export interface AssistantScheduleData {
  sessions: AssistantSession[];
  attendance: AssistantAttendance[];
  scheduleDate: string;
  loading: boolean;
  error: string | null;
}

export interface AssistantRecapData {
  sessions: AssistantSession[];
  attendance: AssistantAttendance[];
  participants: AssistantParticipant[];
  loading: boolean;
  error: string | null;
}

function useClassNames() {
  const [names, setNames] = useState<ReadonlyMap<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenAllClasses(
      (items) => setNames(new Map(items.map((item) => [item.id, item.name]))),
      (message) => setError(message),
    );
    return unsub;
  }, []);

  return { names, error };
}

function useAssistantData() {
  const { firestoreSessions, loading, error: scheduleError } = useFirestoreSchedule();
  const { names, error: classError } = useClassNames();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceDocs, setAttendanceDocs] = useState<AttendanceDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubEnrollments = listenAllEnrollments(setEnrollments, setError);
    const unsubAttendance = listenAllAttendance(setAttendanceDocs, setError);
    return () => {
      unsubEnrollments();
      unsubAttendance();
    };
  }, []);

  const sessions = useMemo(() => {
    const rosterBySession = new Map(
      buildAssistantSessions(firestoreSessions, enrollments).map(
        (sesi) => [sesi.id, sesi.participantIds] as const,
      ),
    );
    return firestoreSessions.map((sesi) => ({
      ...keSesiAsisten(sesi, names),
      participantIds: rosterBySession.get(sesi.id) ?? [],
    }));
  }, [firestoreSessions, enrollments, names]);

  const attendance = useMemo(
    () => buildAssistantAttendance(attendanceDocs),
    [attendanceDocs],
  );

  return {
    sessions,
    attendance,
    enrollments,
    loading,
    error: error ?? classError ?? scheduleError,
  };
}

export function useAssistantScheduleData(): AssistantScheduleData {
  const { sessions, attendance, loading, error } = useAssistantData();
  const hariIni = tanggalHariIniWIB();

  const scheduleDate = useMemo(
    () => pilihTanggalAktif(sessions.map((sesi) => sesi.date), hariIni) ?? hariIni,
    [sessions, hariIni],
  );

  return { sessions, attendance, scheduleDate, loading, error };
}

export function useAssistantRecapData(): AssistantRecapData {
  const { sessions, attendance, enrollments, loading, error } = useAssistantData();

  const participants = useMemo(
    () => buildAssistantParticipants(enrollments),
    [enrollments],
  );

  return { sessions, attendance, participants, loading, error };
}
