import { router, type Href } from 'expo-router';

import ClassListScreen from '@/screens/asisten/kelas/class-list-screen';

export default function AssistantClassesRoute() {
  return (
    <ClassListScreen
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/asisten');
      }}
      onOpenParticipants={classId => {
        // Rute /asisten/peserta akan dibuat pada Task 2.2.
        router.push(`/asisten/peserta?classId=${encodeURIComponent(classId)}` as Href);
      }}
    />
  );
}
