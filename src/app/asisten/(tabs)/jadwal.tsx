import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';

import { listenAllAttendance, type AttendanceDoc } from '@/lib/attendance-service';
import { listenAllEnrollments } from '@/lib/enrollment-service';
import { useFirestoreSchedule } from '@/lib/useSessionFirestore';
import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import {
  buildAssistantAttendance,
  buildAssistantSessions,
} from '@/screens/asisten/schedule-mapping';
import ScheduleScreen from '@/screens/asisten/schedule-screen';
import type { Enrollment } from '@/types';

export default function ScheduleRoute() {
  const preview = useAssistantSessions();
  const { firestoreSessions } = useFirestoreSchedule();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceDocs, setAttendanceDocs] = useState<AttendanceDoc[]>([]);

  useEffect(() => {
    const unsubEnrollments = listenAllEnrollments(setEnrollments);
    const unsubAttendance = listenAllAttendance(setAttendanceDocs);

    return () => {
      unsubEnrollments();
      unsubAttendance();
    };
  }, []);

  const sessions = useMemo(
    () =>
      firestoreSessions.length === 0
        ? preview.sessions
        : buildAssistantSessions(firestoreSessions, enrollments),
    [enrollments, firestoreSessions, preview.sessions]
  );

  const firestoreAttendance = useMemo(
    () => buildAssistantAttendance(attendanceDocs),
    [attendanceDocs]
  );

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
