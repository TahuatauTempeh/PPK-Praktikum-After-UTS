import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { ToastContainer } from '@/components/Toast';
import { SessionProvider } from '@/context/session-context';
import { AssistantPreviewProvider } from '@/screens/asisten/preview-session-provider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
      <SessionProvider>
        <AssistantPreviewProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="select-user" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="(praktikan)" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="(asisten)" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="asisten" options={{ animation: 'slide_from_right' }} />
            </Stack>
            <ToastContainer />
          </ThemeProvider>
        </AssistantPreviewProvider>
      </SessionProvider>
  );
}