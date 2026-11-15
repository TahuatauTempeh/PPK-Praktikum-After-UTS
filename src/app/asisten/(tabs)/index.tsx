import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/auth-context';
import { HomeScreen } from '@/screens/asisten/home-screen';
import { useAssistantSessions } from '@/screens/asisten/preview-session-provider';

export default function HomeRoute() {
  const { profile } = useAuth();
  const { sessions, scheduleDate } = useAssistantSessions();

  if (!profile) return <LoadingState message="Memuat profil..." />;

  return (
    <HomeScreen
      name={profile.name}
      scheduleDate={scheduleDate}
      sessions={sessions}
    />
  );
}
