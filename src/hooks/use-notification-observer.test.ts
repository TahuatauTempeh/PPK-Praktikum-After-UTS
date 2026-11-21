import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useNotificationObserver } from './use-notification-observer';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

describe('useNotificationObserver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates on cold-start when last notification response has valid URL', async () => {
    (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce({
      notification: {
        request: {
          content: {
            data: { url: '/praktikan/presensi/session-123' },
          },
        },
      },
    });

    const removeSub = jest.fn();
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
      remove: removeSub,
    });

    await renderHook(() => useNotificationObserver());

    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/praktikan/presensi/session-123');
    });
  });

  it('ignores cold-start navigation if URL is not a recognized internal route', async () => {
    (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce({
      notification: {
        request: {
          content: {
            data: { url: 'https://malicious.site' },
          },
        },
      },
    });

    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
      remove: jest.fn(),
    });

    await renderHook(() => useNotificationObserver());

    await waitFor(() => {
      expect(Notifications.getLastNotificationResponseAsync).toHaveBeenCalled();
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  it('listens for background notification response and navigates on valid URL', async () => {
    (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValueOnce(null);

    let listenerCallback: ((response: any) => void) | undefined;
    const removeSub = jest.fn();
    (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockImplementation((cb) => {
      listenerCallback = cb;
      return { remove: removeSub };
    });

    const { unmount } = await renderHook(() => useNotificationObserver());

    expect(listenerCallback).toBeDefined();

    // Trigger notification tap
    listenerCallback?.({
      notification: {
        request: {
          content: {
            data: { url: '/(praktikan)/izin' },
          },
        },
      },
    });

    expect(router.push).toHaveBeenCalledWith('/(praktikan)/izin');

    unmount();
    expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
  });
});
