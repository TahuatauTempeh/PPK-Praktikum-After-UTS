import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import React from 'react';
import { AppState } from 'react-native';

import * as notificationService from '@/lib/notification-service';
import * as pushTokenStorage from '@/lib/push-token-storage';
import { NotificationProvider, useNotifications } from './notification-context';

const mockProfile = {
  id: 'user-1',
  expoPushToken: null as string | null,
};

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    profile: mockProfile,
  }),
}));

jest.mock('@/hooks/use-notification-observer', () => ({
  useNotificationObserver: jest.fn(),
}));

jest.mock('@/lib/notification-service', () => ({
  isPushNotificationSupported: jest.fn(),
  checkNotificationPermission: jest.fn(),
  requestNotificationPermission: jest.fn(),
  getExpoPushToken: jest.fn(),
  registerPushToken: jest.fn(),
  unregisterPushTokenBestEffort: jest.fn(),
  isPushTokenRegistrationPaused: jest.fn(() => false),
  openNotificationSettings: jest.fn(),
  setupNotificationChannel: jest.fn(),
}));

jest.mock('@/lib/push-token-storage', () => ({
  getPushTokenOwner: jest.fn(),
  savePushTokenOwner: jest.fn(),
  clearPushTokenOwner: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  addPushTokenListener: jest.fn(),
}));

describe('NotificationContext', () => {
  let appStateListener: ((state: string) => void) | undefined;
  let pushTokenListener: ((token: { type: string; data: string }) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProfile.id = 'user-1';
    mockProfile.expoPushToken = null;
    appStateListener = undefined;
    pushTokenListener = undefined;

    (notificationService.isPushNotificationSupported as jest.Mock).mockReturnValue(true);
    (notificationService.checkNotificationPermission as jest.Mock).mockResolvedValue('granted');
    (notificationService.requestNotificationPermission as jest.Mock).mockResolvedValue('granted');
    (notificationService.getExpoPushToken as jest.Mock).mockResolvedValue(
      'ExponentPushToken[token]'
    );
    (notificationService.setupNotificationChannel as jest.Mock).mockResolvedValue(undefined);
    (notificationService.registerPushToken as jest.Mock).mockResolvedValue(undefined);
    (notificationService.unregisterPushTokenBestEffort as jest.Mock).mockResolvedValue(undefined);
    (notificationService.isPushTokenRegistrationPaused as jest.Mock).mockReturnValue(false);
    (notificationService.openNotificationSettings as jest.Mock).mockResolvedValue(undefined);
    (pushTokenStorage.getPushTokenOwner as jest.Mock).mockResolvedValue(null);
    (pushTokenStorage.savePushTokenOwner as jest.Mock).mockResolvedValue(undefined);
    (pushTokenStorage.clearPushTokenOwner as jest.Mock).mockResolvedValue(undefined);

    jest.spyOn(AppState, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'change') {
        appStateListener = listener as (state: string) => void;
      }
      return { remove: jest.fn() } as never;
    });

    (Notifications.addPushTokenListener as jest.Mock).mockImplementation((listener) => {
      pushTokenListener = listener;
      return { remove: jest.fn() };
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it('mengembalikan nilai fallback aman bila dipanggil di luar provider', async () => {
    const { result } = await renderHook(() => useNotifications());
    expect(result.current.status).toBe('idle');
    expect(result.current.token).toBeNull();
  });

  it('mengatur status ke unsupported jika perangkat tidak mendukung push', async () => {
    (notificationService.isPushNotificationSupported as jest.Mock).mockReturnValue(false);

    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe('unsupported');
  });

  it('mengambil status dan token saat izin granted', async () => {
    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('granted');
    });

    expect(notificationService.getExpoPushToken).toHaveBeenCalled();
    expect(notificationService.setupNotificationChannel).toHaveBeenCalled();
    expect(notificationService.registerPushToken).toHaveBeenCalledWith(
      'user-1',
      'ExponentPushToken[token]'
    );
    expect(pushTokenStorage.savePushTokenOwner).toHaveBeenCalledWith(
      'user-1',
      'ExponentPushToken[token]'
    );
  });

  it('mengaktifkan notifikasi saat enableNotifications dipanggil', async () => {
    (notificationService.checkNotificationPermission as jest.Mock).mockResolvedValue('denied');
    (notificationService.getExpoPushToken as jest.Mock).mockResolvedValue(
      'ExponentPushToken[456]'
    );

    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('denied');
    });

    await act(async () => {
      await result.current.enableNotifications();
    });

    expect(notificationService.requestNotificationPermission).toHaveBeenCalled();
    expect(result.current.status).toBe('granted');
    expect(notificationService.registerPushToken).toHaveBeenCalledWith(
      'user-1',
      'ExponentPushToken[456]'
    );
  });

  it('listener rotasi memakai Expo token, bukan token FCM mentah', async () => {
    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('granted');
    });

    (notificationService.registerPushToken as jest.Mock).mockClear();
    (notificationService.getExpoPushToken as jest.Mock).mockResolvedValue(
      'ExponentPushToken[rotated]'
    );

    await act(async () => {
      pushTokenListener?.({ type: 'android', data: 'fcm-raw-token' });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(notificationService.registerPushToken).toHaveBeenCalledWith(
        'user-1',
        'ExponentPushToken[rotated]'
      );
    });
    expect(notificationService.registerPushToken).not.toHaveBeenCalledWith(
      'user-1',
      'fcm-raw-token'
    );
  });

  it('refresh lagi saat aplikasi kembali aktif', async () => {
    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('granted');
    });

    (notificationService.checkNotificationPermission as jest.Mock).mockClear();

    await act(async () => {
      appStateListener?.('active');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(notificationService.checkNotificationPermission).toHaveBeenCalled();
    });
  });

  it('menghapus token profil bila izin dicabut dan token milik perangkat ini', async () => {
    mockProfile.expoPushToken = 'ExponentPushToken[token]';
    (pushTokenStorage.getPushTokenOwner as jest.Mock).mockResolvedValue({
      uid: 'user-1',
      token: 'ExponentPushToken[token]',
    });

    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('granted');
    });

    (notificationService.checkNotificationPermission as jest.Mock).mockResolvedValue('blocked');

    await act(async () => {
      appStateListener?.('active');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(notificationService.unregisterPushTokenBestEffort).toHaveBeenCalledWith('user-1');
    });
    expect(result.current.status).toBe('blocked');
  });

  it('tidak menghapus token profil milik perangkat lain', async () => {
    mockProfile.expoPushToken = 'ExponentPushToken[other-device]';
    (pushTokenStorage.getPushTokenOwner as jest.Mock).mockResolvedValue({
      uid: 'user-1',
      token: 'ExponentPushToken[this-device]',
    });
    (notificationService.getExpoPushToken as jest.Mock).mockResolvedValue(
      'ExponentPushToken[this-device]'
    );

    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('granted');
    });

    (notificationService.checkNotificationPermission as jest.Mock).mockResolvedValue('blocked');

    await act(async () => {
      appStateListener?.('active');
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('blocked');
    });
    expect(notificationService.unregisterPushTokenBestEffort).not.toHaveBeenCalled();
  });

  it('tidak mendaftarkan token saat registrasi sedang ditahan', async () => {
    (notificationService.isPushTokenRegistrationPaused as jest.Mock).mockReturnValue(true);

    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.refresh();
    });

    expect(notificationService.registerPushToken).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('menampilkan status error bila izin granted tetapi token tidak tersedia', async () => {
    (notificationService.getExpoPushToken as jest.Mock).mockResolvedValue(null);

    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.lastError).toContain('Token notifikasi belum tersedia');
  });
});
