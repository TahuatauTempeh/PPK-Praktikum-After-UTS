import { router, Tabs, usePathname } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TAB_TRANSITION_SPEC, tabSlideInterpolator } from '@/constants/tab-transition';
import { useAuth } from '@/context/auth-context';
import { AssistantNavigation, type AssistantTab } from '@/screens/asisten/components/assistant-navigation';
import { useTheme } from '@/theme';

const tabFromPath = (pathname: string): AssistantTab | null => {
  if (pathname === '/asisten/profil') return 'profile';
  if (pathname === '/asisten/admin') return 'admin';
  if (pathname === '/asisten' || pathname === '/asisten/jadwal' || pathname === '/asisten/rekap') return 'asisten';
  return null;
};

export default function TabsLayout() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { width } = useWindowDimensions();
  const showAdmin = profile?.isAdmin === true;
  const pathname = usePathname();
  const current = tabFromPath(pathname);
  // Non-admin yang membuka /asisten/admin tetap melihat tab Asisten aktif saat diarahkan keluar.
  const safeCurrent = current === 'admin' && !showAdmin ? 'asisten' : current;
  const [active, setActive] = useState<AssistantTab>(safeCurrent ?? 'asisten');
  if (safeCurrent && safeCurrent !== active) setActive(safeCurrent);

  const goTo = (tab: AssistantTab) => {
    if (tab === 'profile') router.navigate('/asisten/profil');
    else if (tab === 'admin') router.navigate('/asisten/admin');
    else router.navigate('/asisten');
  };

  return (
    <Tabs
      backBehavior="history"
      tabBar={() => (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: theme.colors.background }}>
          <AssistantNavigation active={active} showAdmin={showAdmin} onNavigate={goTo} />
        </SafeAreaView>
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        transitionSpec: TAB_TRANSITION_SPEC,
        sceneStyleInterpolator: tabSlideInterpolator(width),
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="jadwal" />
      <Tabs.Screen name="rekap" />
      <Tabs.Screen name="admin" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
