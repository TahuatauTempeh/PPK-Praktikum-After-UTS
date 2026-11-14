import { router, Stack, usePathname } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { AssistantNavigation, type AssistantTab } from '@/screens/asisten/components/assistant-navigation';
import { useAssistantTheme } from '@/screens/asisten/theme';
import { usePraktikanTheme } from '@/screens/praktikan/theme';

const tabFromPath = (pathname: string): AssistantTab | null => {
  if (pathname === '/asisten/profil') return 'profile';
  if (pathname === '/asisten/admin') return 'admin';
  if (pathname === '/asisten' || pathname === '/asisten/jadwal' || pathname === '/asisten/rekap') return 'asisten';
  return null;
};

export default function TabsLayout() {
  const theme = useAssistantTheme();
  const { profile } = useAuth();
  const barTheme = usePraktikanTheme();
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
    <View style={[styles.container, { backgroundColor: barTheme.dasarNav }]}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: barTheme.dasarNav }}>
        <AssistantNavigation active={active} showAdmin={showAdmin} onNavigate={goTo} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
