import { router } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import SessionManageListScreen from '@/screens/asisten/sesi/session-manage-list-screen';

export default function AssistantManageScheduleRoute() {
  const { profile } = useAuth();
  return (
    <SessionManageListScreen
      assistantId={profile?.id}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten');
      }}
    />
  );
}
