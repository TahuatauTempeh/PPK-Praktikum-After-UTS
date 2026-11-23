import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  listenUserAttendance,
  toAttendanceRecordsForUser,
  type AttendanceDoc,
} from '@/lib/attendance-service';
import { getAllClasses } from '@/lib/class-service';
import { getSessionsForPraktikan } from '@/lib/session-service';
import { toPraktikanSession } from '@/screens/praktikan/selectors';
import type { Session } from '@/types';

/** Memuat daftar sesi dan kehadiran realtime praktikan dari Firestore. */
export function usePraktikanSchedule(userId: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendanceDocs, setAttendanceDocs] = useState<AttendanceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    return listenUserAttendance(userId, setAttendanceDocs);
  }, [userId]);

  const attendance = useMemo(
    () => (userId ? toAttendanceRecordsForUser(attendanceDocs, userId) : []),
    [attendanceDocs, userId]
  );

  const loadData = useCallback(async () => {
    if (!userId) return [];
    const [rawSessions, classes] = await Promise.all([
      getSessionsForPraktikan(userId),
      getAllClasses(),
    ]);
    const classMap = new Map(classes.map((item) => [item.id, item]));
    return rawSessions.map((item) => toPraktikanSession(item, classMap));
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const mapped = await loadData();
      setSessions(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jadwal praktikum.');
    } finally {
      setLoading(false);
    }
  }, [loadData, userId]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let active = true;
      loadData()
        .then((mapped) => {
          if (!active) return;
          setSessions(mapped);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : 'Gagal memuat jadwal praktikum.');
          setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [loadData, userId])
  );

  return { sessions, attendance, loading, error, refresh };
}
