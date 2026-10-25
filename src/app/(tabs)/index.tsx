import { router, useLocalSearchParams } from 'expo-router';

import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import { isValidDate } from '@/screens/asisten/recap-data';
import ScheduleScreen from '@/screens/asisten/schedule-screen';

export default function ScheduleRoute() {
  const { sessions, attendance, scheduleDate } = useAssistantSessions();
  const { tanggal, baru } = useLocalSearchParams<{ tanggal?: string; baru?: string }>();
  const date = typeof tanggal === 'string' && isValidDate(tanggal) ? tanggal : scheduleDate;
  const added = sessions.some(session => session.id === baru && session.date === date);
  return <ScheduleScreen key={baru ?? date} sessions={sessions} attendance={attendance} date={date}
    feedback={added ? 'Sesi berhasil ditambahkan.' : undefined}
    onAdd={() => router.push('/tambah-sesi')}
    onManage={id => router.push({ pathname: '/sesi/[id]', params: { id } })} />;
}
