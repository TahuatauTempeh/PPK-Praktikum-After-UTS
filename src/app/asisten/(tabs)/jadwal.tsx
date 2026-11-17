import { useMemo } from 'react';
import { router } from 'expo-router';

import { useFirestoreSchedule } from '@/lib/useSessionFirestore';
import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import type { AssistantSession } from '@/screens/asisten/schedule-data';
import ScheduleScreen from '@/screens/asisten/schedule-screen';

export default function ScheduleRoute() {
  const preview = useAssistantSessions();
  const { firestoreSessions } = useFirestoreSchedule();

  const sessions: readonly AssistantSession[] = useMemo(() => {
    if (firestoreSessions.length === 0) return preview.sessions;
    return firestoreSessions.map((s) => ({
      id: s.id,
      code: s.classId || 'P1',
      course: s.title,
      topic: s.title,
      className: s.classId || 'Kelas Praktikum',
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      status: (s.status === 'scheduled' ? 'pending' : s.status) as 'pending' | 'open' | 'closed',
      participantIds: [] as readonly string[],
    }));
  }, [firestoreSessions, preview.sessions]);

  const activeDate = sessions[0]?.date ?? preview.scheduleDate;

  return (
    <ScheduleScreen
      sessions={sessions}
      attendance={preview.attendance}
      date={activeDate}
      onManage={(id) => router.push({ pathname: '/asisten/sesi/[id]', params: { id } })}
      onBack={() => router.navigate('/asisten')}
    />
  );
}

