import { router, type Href } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import ClassListScreen from '@/screens/asisten/kelas/class-list-screen';

export default function AssistantClassesRoute() {
  const { profile } = useAuth();
  return (
    <ClassListScreen
      assistantId={profile?.id}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten');
      }}
      onOpenParticipants={classId => {
        router.push(`/asisten/peserta?classId=${encodeURIComponent(classId)}` as Href);
      }}
    />
  );
}
