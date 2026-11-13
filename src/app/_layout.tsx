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

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { ToastContainer } from '@/components/Toast';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { SessionProvider } from '@/context/session-context';
import { missingFirebaseEnvKeys } from '@/lib/firebase/app';
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

  if (!loaded && !error) return null;

  return (
    <AuthProvider>
      <SessionProvider>
        <AssistantPreviewProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar style="auto" />
            <RootNavigator />
            <ToastContainer />
          </ThemeProvider>
        </AssistantPreviewProvider>
      </SessionProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { status, profile, profileError, signOut, refreshProfile } = useAuth();

  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  if (missingFirebaseEnvKeys.length > 0) {
    return (
      <ErrorState
        title="Konfigurasi Firebase belum lengkap"
        message={`Isi variabel berikut di .env: ${missingFirebaseEnvKeys.join(', ')}`}
      />
    );
  }

  if (status === 'loading') {
    return <LoadingState message="Memuat sesi..." />;
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Gagal memuat profil"
        message={profileError?.message ?? 'Terjadi kesalahan.'}
        onRetry={refreshProfile}
        secondaryLabel="Keluar"
        onSecondary={signOut}
      />
    );
  }

  if (status === 'profile-missing') {
    return (
      <ErrorState
        title="Profil tidak ditemukan"
        message="Akun ini belum memiliki profil. Hubungi admin."
        secondaryLabel="Keluar"
        onSecondary={signOut}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected
        guard={!profile}
        redirectTo={profile?.role === 'asisten' ? '/asisten/utama' : '/(praktikan)'}
      >
        <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>

      <Stack.Protected
        guard={profile?.role === 'praktikan'}
        redirectTo={profile?.role === 'asisten' ? '/asisten/utama' : '/login'}
      >
        <Stack.Screen name="(praktikan)" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="praktikan/sesi/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>

      <Stack.Protected
        guard={profile?.role === 'asisten'}
        redirectTo={profile?.role === 'praktikan' ? '/(praktikan)' : '/login'}
      >
        <Stack.Screen name="asisten/utama" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="asisten/(tabs)" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="asisten/sesi/[id]" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>

      <Stack.Protected
        guard={profile?.isAdmin === true}
        redirectTo={
          profile?.role === 'asisten'
            ? '/asisten/utama'
            : profile?.role === 'praktikan'
              ? '/(praktikan)'
              : '/login'
        }
      >
        <Stack.Screen name="(admin)" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>

      <Stack.Screen name="index" />
    </Stack>
  );
}
