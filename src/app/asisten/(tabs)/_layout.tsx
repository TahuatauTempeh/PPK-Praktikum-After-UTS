import { router, Stack, usePathname } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssistantNavigation, type AssistantTab } from '@/screens/asisten/components/assistant-navigation';
import { assistantTheme as theme } from '@/screens/asisten/theme';

const tabFromPath = (pathname: string): AssistantTab | null => {
  if (pathname === '/asisten/rekap') return 'recap';
  if (pathname === '/asisten') return 'schedule';
  return null;
};

export default function TabsLayout() {
  const pathname = usePathname();
  const current = tabFromPath(pathname);
  const [active, setActive] = useState<AssistantTab>(current ?? 'schedule');
  if (current && current !== active) setActive(current);

  const goTo = (tab: AssistantTab) => {
    if (tab === 'recap') router.navigate('/asisten/rekap');
    else router.dismissTo('/asisten');
  };

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.bar}>
        <AssistantNavigation active={active}
          onSchedule={() => goTo('schedule')}
          onRecap={() => goTo('recap')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  bar: { backgroundColor: theme.colors.background },
});
