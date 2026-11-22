import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';

import { listenAllAttendance, type AttendanceDoc } from '@/lib/attendance-service';
import { listenAllClasses } from '@/lib/class-service';
import { listenAllEnrollments } from '@/lib/enrollment-service';
import { useFirestoreSchedule } from '@/lib/useSessionFirestore';
import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import type { AssistantAttendance, AssistantSession } from '@/screens/asisten/schedule-data';
import ScheduleScreen from '@/screens/asisten/schedule-screen';
import type { Enrollment } from '@/types';

function groupIdsByKey<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  getValue: (item: T) => string
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const item of items) {
    const key = getKey(item);
    const value = getValue(item);
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  }
  return map;
}

export default function ScheduleRoute() {
  const preview = useAssistantSessions();
  const { firestoreSessions } = useFirestoreSchedule();
  const [classNameMap, setClassNameMap] = useState<ReadonlyMap<string, string>>(
    () => new Map()
  );
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceDocs, setAttendanceDocs] = useState<AttendanceDoc[]>([]);

  useEffect(() => {
    const unsubClasses = listenAllClasses((classes) => {
      setClassNameMap(new Map(classes.map((item) => [item.id, item.name])));
    });
    const unsubEnrollments = listenAllEnrollments(setEnrollments);
    const unsubAttendance = listenAllAttendance(setAttendanceDocs);

    return () => {
      unsubClasses();
      unsubEnrollments();
      unsubAttendance();
    };
  }, []);

  const enrolledByClass = useMemo(
    () => groupIdsByKey(enrollments, (item) => item.classId, (item) => item.userId),
    [enrollments]
  );

  const attendedBySession = useMemo(
    () => groupIdsByKey(attendanceDocs, (item) => item.sessionId, (item) => item.userId),
    [attendanceDocs]
  );

  const firestoreAttendance: readonly AssistantAttendance[] = useMemo(
    () =>
      attendanceDocs.map((item) => ({
        sessionId: item.sessionId,
        participantId: item.userId,
        recordedAt: '',
      })),
    [attendanceDocs]
  );

  const sessions: readonly AssistantSession[] = useMemo(() => {
    if (firestoreSessions.length === 0) return preview.sessions;
    return firestoreSessions.map((s) => {
      const resolvedClassName = classNameMap.get(s.classId)?.trim() ?? '';
      const enrolledIds = enrolledByClass.get(s.classId) ?? [];
      const attendedIds = attendedBySession.get(s.id) ?? [];
      const participantIds = Array.from(new Set([...enrolledIds, ...attendedIds]));
      return {
        id: s.id,
        code: '',
        course: resolvedClassName || s.title,
        topic: s.title,
        className: resolvedClassName || 'Kelas Praktikum',
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        status: (s.status === 'scheduled' ? 'pending' : s.status) as 'pending' | 'open' | 'closed',
        participantIds,
      };
    });
  }, [
    attendedBySession,
    classNameMap,
    enrolledByClass,
    firestoreSessions,
    preview.sessions,
  ]);

  const activeDate = sessions[0]?.date ?? preview.scheduleDate;
  const activeAttendance =
    firestoreSessions.length === 0 ? preview.attendance : firestoreAttendance;

  return (
    <ScheduleScreen
      sessions={sessions}
      attendance={activeAttendance}
      date={activeDate}
      onManage={(id) => router.push({ pathname: '/asisten/sesi/[id]', params: { id } })}
      onBack={() => router.navigate('/asisten')}
    />
  );
}

