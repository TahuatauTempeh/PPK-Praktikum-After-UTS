import { router, Stack, usePathname } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssistantNavigation, type AssistantTab } from '@/screens/asisten/components/assistant-navigation';
import { assistantTheme as theme } from '@/screens/asisten/theme';

const tabFromPath = (pathname: string): AssistantTab | null => {
  if (pathname === '/asisten/profil') return 'profile';
  if (pathname === '/asisten') return 'home';
  return null;
};

export default function TabsLayout() {
  const pathname = usePathname();
  const current = tabFromPath(pathname);
  const [active, setActive] = useState<AssistantTab>(current ?? 'home');
  if (current && current !== active) setActive(current);

  const goTo = (tab: AssistantTab) => {
    if (tab === 'profile') router.navigate('/asisten/profil');
    else router.dismissTo('/asisten');
  };

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.bar}>
        <AssistantNavigation active={active}
          onHome={() => goTo('home')}
          onProfile={() => goTo('profile')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  bar: { backgroundColor: '#E8EFF9' },
});
