import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { Linking, Platform } from 'react-native';

import {
  checkNotificationPermission,
  getEasProjectId,
  getExpoPushToken,
  isPushNotificationSupported,
  openNotificationSettings,
  registerPushToken,
  requestNotificationPermission,
  setupNotificationChannel,
  unregisterPushToken,
} from './notification-service';

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'custom-project-id',
      },
    },
  },
}));

jest.mock('expo-notifications', () => ({
  AndroidImportance: {
    MAX: 5,
  },
  IosAuthorizationStatus: {
    PROVISIONAL: 3,
  },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getDb: jest.fn(() => ({})),
  COLLECTIONS: {
    users: 'users',
  },
}));

describe('notification-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'android';
    (Device as any).isDevice = true;
  });

  describe('isPushNotificationSupported', () => {
    it('mengembalikan false jika di web', () => {
      (Platform as any).OS = 'web';
      expect(isPushNotificationSupported()).toBe(false);
    });

    it('mengembalikan false jika bukan perangkat fisik', () => {
      (Device as any).isDevice = false;
      expect(isPushNotificationSupported()).toBe(false);
    });

    it('mengembalikan true jika perangkat fisik di native', () => {
      expect(isPushNotificationSupported()).toBe(true);
    });
  });

  describe('getEasProjectId', () => {
    it('mengembalikan project ID dari config jika tersedia', () => {
      expect(getEasProjectId()).toBe('custom-project-id');
    });
  });

  describe('setupNotificationChannel', () => {
    it('membuat channel praktikum pada Android', async () => {
      await setupNotificationChannel();
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('praktikum', {
        name: 'Praktikum',
        importance: 7,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#204CAC',
      });
    });

    it('tidak memanggil setNotificationChannelAsync jika bukan Android', async () => {
      (Platform as any).OS = 'ios';
      await setupNotificationChannel();
      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });
  });

  describe('checkNotificationPermission', () => {
    it('mengembalikan unsupported jika bukan device yang didukung', async () => {
      (Device as any).isDevice = false;
      const status = await checkNotificationPermission();
      expect(status).toBe('unsupported');
    });

    it('mengembalikan granted jika izin sudah diberikan', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: true,
        canAskAgain: true,
      });

      const status = await checkNotificationPermission();
      expect(status).toBe('granted');
    });

    it('mengembalikan blocked jika tidak granted dan tidak bisa meminta lagi', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: false,
        canAskAgain: false,
      });

      const status = await checkNotificationPermission();
      expect(status).toBe('blocked');
    });

    it('mengembalikan denied jika ditolak tetapi masih bisa diminta', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: false,
        canAskAgain: true,
      });

      const status = await checkNotificationPermission();
      expect(status).toBe('denied');
    });
  });

  describe('requestNotificationPermission', () => {
    it('meminta izin dan mengembalikan granted jika disetujui', async () => {
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: true,
        canAskAgain: true,
      });

      const status = await requestNotificationPermission();
      expect(status).toBe('granted');
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalled();
    });
  });

  describe('getExpoPushToken', () => {
    it('mengambil token push dengan project ID', async () => {
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValueOnce({
        data: 'ExponentPushToken[xxxxxxxxxxxxxx]',
      });

      const token = await getExpoPushToken();
      expect(token).toBe('ExponentPushToken[xxxxxxxxxxxxxx]');
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
        projectId: 'custom-project-id',
      });
    });

    it('mengembalikan null jika perangkat tidak didukung', async () => {
      (Device as any).isDevice = false;
      const token = await getExpoPushToken();
      expect(token).toBeNull();
    });
  });

  describe('registerPushToken & unregisterPushToken', () => {
    it('menyimpan token dan platform ke dokumen pengguna', async () => {
      await registerPushToken('user123', 'ExponentPushToken[abc]');
      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          expoPushToken: 'ExponentPushToken[abc]',
          pushPlatform: 'android',
          pushUpdatedAt: 'SERVER_TIMESTAMP',
        })
      );
    });

    it('menghapus token push pengguna saat unregister', async () => {
      await unregisterPushToken('user123');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          expoPushToken: null,
          pushPlatform: null,
          pushUpdatedAt: 'SERVER_TIMESTAMP',
        })
      );
    });
  });

  describe('openNotificationSettings', () => {
    it('membuka settings lewat Linking.openSettings', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      const openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined as any);

      await openNotificationSettings();
      expect(openSettingsSpy).toHaveBeenCalled();
    });
  });
});
