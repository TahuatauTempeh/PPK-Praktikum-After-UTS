import { router, useLocalSearchParams } from 'expo-router';

import ParticipantListScreen from '@/screens/asisten/peserta/participant-list-screen';

export default function AssistantParticipantsRoute() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  return (
    <ParticipantListScreen
      initialClassId={typeof classId === 'string' ? classId : undefined}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten');
      }}
    />
  );
}
