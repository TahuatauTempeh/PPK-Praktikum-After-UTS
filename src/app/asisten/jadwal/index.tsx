import { router, useLocalSearchParams } from 'expo-router';

import SessionManageListScreen from '@/screens/asisten/sesi/session-manage-list-screen';

export default function AssistantManageScheduleRoute() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  return (
    <SessionManageListScreen
      initialClassId={typeof classId === 'string' ? classId : undefined}
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten');
      }}
    />
  );
}
