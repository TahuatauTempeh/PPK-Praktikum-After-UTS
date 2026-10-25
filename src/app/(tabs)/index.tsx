import { router } from 'expo-router';

import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import ScheduleScreen from '@/screens/asisten/schedule-screen';

export default function ScheduleRoute() {
  const { sessions, attendance, scheduleDate } = useAssistantSessions();
  return <ScheduleScreen sessions={sessions} attendance={attendance} date={scheduleDate}
    onManage={id => router.push({ pathname: '/sesi/[id]', params: { id } })} />;
}
