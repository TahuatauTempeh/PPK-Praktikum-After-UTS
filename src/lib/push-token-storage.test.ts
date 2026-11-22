import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearPushTokenOwner,
  getPushTokenOwner,
  savePushTokenOwner,
} from './push-token-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('push-token-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('menyimpan uid dan token pemilik perangkat', async () => {
    await savePushTokenOwner('user-1', 'ExponentPushToken[abc]');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@presensi/push-token-owner',
      JSON.stringify({ uid: 'user-1', token: 'ExponentPushToken[abc]' })
    );
  });

  it('mengembalikan null bila belum ada data', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    await expect(getPushTokenOwner()).resolves.toBeNull();
  });

  it('membaca data pemilik yang tersimpan', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ uid: 'user-1', token: 'ExponentPushToken[abc]' })
    );

    await expect(getPushTokenOwner()).resolves.toEqual({
      uid: 'user-1',
      token: 'ExponentPushToken[abc]',
    });
  });

  it('mengembalikan null untuk data rusak', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{bukan-json');

    await expect(getPushTokenOwner()).resolves.toBeNull();
  });

  it('menghapus data pemilik tanpa melempar error', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('storage error'));

    await expect(clearPushTokenOwner()).resolves.toBeUndefined();
  });
});
