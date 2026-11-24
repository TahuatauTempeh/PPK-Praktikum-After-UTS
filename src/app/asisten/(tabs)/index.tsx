import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/auth-context';
import { HomeScreen } from '@/screens/asisten/home-screen';
import { useAssistantScheduleData } from '@/screens/asisten/use-assistant-data';

export default function HomeRoute() {
  const { profile } = useAuth();
  const { sessions, scheduleDate, loading, error } = useAssistantScheduleData();

  if (!profile) return <LoadingState message="Memuat profil..." />;
  if (loading) return <LoadingState message="Memuat jadwal..." />;
  if (error) return <ErrorState message={error} />;

  return <HomeScreen name={profile.name} scheduleDate={scheduleDate} sessions={sessions} />;
}
