import { router } from 'expo-router';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import ScheduleScreen from '@/screens/asisten/schedule-screen';
import { useAssistantScheduleData } from '@/screens/asisten/use-assistant-data';

export default function ScheduleRoute() {
  const { sessions, attendance, scheduleDate, loading, error } = useAssistantScheduleData();

  if (loading) return <LoadingState message="Memuat jadwal..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <ScheduleScreen
      sessions={sessions}
      attendance={attendance}
      date={scheduleDate}
      onManage={(id) => router.push({ pathname: '/asisten/sesi/[id]', params: { id } })}
      onBack={() => router.navigate('/asisten')}
    />
  );
}
