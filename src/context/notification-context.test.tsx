import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import * as notificationService from '@/lib/notification-service';
import { NotificationProvider, useNotifications } from './notification-context';

jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { uid: 'user-1' },
    profile: { id: 'user-1', expoPushToken: null },
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
  openNotificationSettings: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
}));

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mengembalikan nilai fallback aman bila dipanggil di luar provider', async () => {
    const { result } = await renderHook(() => useNotifications());
    expect(result.current.status).toBe('idle');
    expect(result.current.token).toBeNull();
  });

  it('mengatur status ke unsupported jika perangkat tidak mendukung push', async () => {
    (notificationService.isPushNotificationSupported as jest.Mock).mockReturnValue(false);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    );

    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe('unsupported');
  });

  it('mengambil status dan token saat izin granted', async () => {
    (notificationService.isPushNotificationSupported as jest.Mock).mockReturnValue(true);
    (notificationService.checkNotificationPermission as jest.Mock).mockResolvedValue('granted');
    (notificationService.getExpoPushToken as jest.Mock).mockResolvedValue('ExponentPushToken[123]');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    );

    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe('granted');
    expect(result.current.token).toBe('ExponentPushToken[123]');
    expect(notificationService.registerPushToken).toHaveBeenCalledWith('user-1', 'ExponentPushToken[123]');
  });

  it('mengaktifkan notifikasi saat enableNotifications dipanggil', async () => {
    (notificationService.isPushNotificationSupported as jest.Mock).mockReturnValue(true);
    (notificationService.checkNotificationPermission as jest.Mock).mockResolvedValue('denied');
    (notificationService.requestNotificationPermission as jest.Mock).mockResolvedValue('granted');
    (notificationService.getExpoPushToken as jest.Mock).mockResolvedValue('ExponentPushToken[456]');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    );

    const { result } = await renderHook(() => useNotifications(), { wrapper });

    await act(async () => {
      await result.current.enableNotifications();
    });

    expect(result.current.status).toBe('granted');
    expect(result.current.token).toBe('ExponentPushToken[456]');
  });
});
