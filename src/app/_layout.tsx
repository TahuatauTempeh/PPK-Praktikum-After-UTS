/**
 * Root Layout — Wrap dengan SessionProvider dan Stack navigator.
 * Mengatur navigasi utama: auth screens → tab groups.
 */

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { SessionProvider } from '@/context/session-context';
import { ToastContainer } from '@/components/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SessionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="select-user"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="(praktikan)"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="(asisten)"
            options={{
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        <ToastContainer />
      </ThemeProvider>
    </SessionProvider>
  );
}
