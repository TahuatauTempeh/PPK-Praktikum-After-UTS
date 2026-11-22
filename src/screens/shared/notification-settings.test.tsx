import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { useNotifications } from '@/context/notification-context';
import { NotificationSettings } from './notification-settings';

jest.mock('@/context/notification-context', () => ({
  useNotifications: jest.fn(),
}));

jest.mock('@/screens/praktikan/components/ikon', () => ({
  Ikon: () => null,
}));

describe('<NotificationSettings />', () => {
  const mockEnableNotifications = jest.fn();
  const mockOpenSettings = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('menampilkan status Aktif saat izin granted', async () => {
    (useNotifications as jest.Mock).mockReturnValue({
      status: 'granted',
      enableNotifications: mockEnableNotifications,
      openSettings: mockOpenSettings,
      refresh: mockRefresh,
    });

    const { getByText } = await render(<NotificationSettings />);
    expect(getByText('Status')).toBeTruthy();
    expect(getByText('Aktif')).toBeTruthy();
  });

  it('menampilkan status Belum diizinkan dan tombol aktifkan saat status denied', async () => {
    (useNotifications as jest.Mock).mockReturnValue({
      status: 'denied',
      enableNotifications: mockEnableNotifications,
      openSettings: mockOpenSettings,
      refresh: mockRefresh,
    });

    const { getByText } = await render(<NotificationSettings />);
    expect(getByText('Belum diizinkan')).toBeTruthy();

    const tombol = getByText('Aktifkan notifikasi');
    await fireEvent.press(tombol);
    expect(mockEnableNotifications).toHaveBeenCalled();
  });

  it('menampilkan status Ditolak dan tombol pengaturan saat status blocked', async () => {
    (useNotifications as jest.Mock).mockReturnValue({
      status: 'blocked',
      enableNotifications: mockEnableNotifications,
      openSettings: mockOpenSettings,
      refresh: mockRefresh,
    });

    const { getByText } = await render(<NotificationSettings />);
    expect(getByText('Ditolak')).toBeTruthy();

    const tombol = getByText('Buka pengaturan');
    await fireEvent.press(tombol);
    expect(mockOpenSettings).toHaveBeenCalled();
  });

  it('menampilkan keterangan tidak didukung saat status unsupported', async () => {
    (useNotifications as jest.Mock).mockReturnValue({
      status: 'unsupported',
      enableNotifications: mockEnableNotifications,
      openSettings: mockOpenSettings,
      refresh: mockRefresh,
    });

    const { getByText } = await render(<NotificationSettings />);
    expect(getByText('Tidak didukung')).toBeTruthy();
    expect(
      getByText('Notifikasi push tidak didukung pada browser atau perangkat tanpa layanan push.')
    ).toBeTruthy();
  });

  it('menampilkan status Gagal dan tombol coba lagi saat status error', async () => {
    (useNotifications as jest.Mock).mockReturnValue({
      status: 'error',
      enableNotifications: mockEnableNotifications,
      openSettings: mockOpenSettings,
      refresh: mockRefresh,
    });

    const { getByText } = await render(<NotificationSettings />);
    expect(getByText('Gagal')).toBeTruthy();
    expect(
      getByText('Notifikasi belum aktif. Perubahan tetap terlihat saat aplikasi dibuka.')
    ).toBeTruthy();

    const tombol = getByText('Coba lagi');
    await fireEvent.press(tombol);
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockEnableNotifications).not.toHaveBeenCalled();
  });
});
