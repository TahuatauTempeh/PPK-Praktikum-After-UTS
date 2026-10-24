import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AssistantPreviewProvider } from '@/screens/asisten/preview-session-provider';
import { assistantTheme } from '@/screens/asisten/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="dark" />
      <AssistantPreviewProvider>
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: assistantTheme.colors.background },
        }} />
      </AssistantPreviewProvider>
    </>
  );
}
