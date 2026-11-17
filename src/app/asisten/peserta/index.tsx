import { router, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import ParticipantListScreen from '@/screens/asisten/peserta/participant-list-screen';

export default function AssistantParticipantsRoute() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  const { profile } = useAuth();
  return (
    <ParticipantListScreen
      initialClassId={typeof classId === 'string' ? classId : undefined}
      assistantId={profile?.id}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten');
      }}
    />
  );
}
