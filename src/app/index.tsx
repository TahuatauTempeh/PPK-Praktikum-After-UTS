import { router } from 'expo-router';

import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';
import ScheduleScreen from '@/screens/asisten/schedule-screen';

export default function ScheduleRoute() {
  const { sessions, attendance } = useAssistantSessions();
  return <ScheduleScreen sessions={sessions} attendance={attendance}
    onRecap={() => router.navigate('/rekap')}
    onManage={id => router.push({ pathname: '/sesi/[id]', params: { id } })} />;
}
