import { router, type Href } from 'expo-router';

import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import ScheduleScreen from '@/screens/asisten/schedule-screen';

export default function ScheduleRoute() {
  const { sessions, attendance, scheduleDate } = useAssistantSessions();
  return <ScheduleScreen sessions={sessions} attendance={attendance} date={scheduleDate}
    onManage={id => router.push({ pathname: '/asisten/sesi/[id]', params: { id } })}
    onManageClasses={() => router.push('/asisten/kelas' as Href)}
    onManageParticipants={() => router.push('/asisten/peserta' as Href)}
    onManageSessions={() => router.push('/asisten/jadwal' as Href)} />;
}
