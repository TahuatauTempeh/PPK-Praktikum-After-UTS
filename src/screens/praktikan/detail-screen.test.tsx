import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { FirestoreSession } from '@/lib/session-actions';
import { useMyAttendance } from '@/lib/useSessionFirestore';
import { bukaPresensi } from '@/screens/praktikan/navigasi';

import DetailSesiScreen from './detail-screen';

jest.mock('expo-router', () => ({
  router: { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 's1' }),
}));
jest.mock('@/context/auth-context', () => ({ useAuth: () => ({ profile: { id: 'u1' } }) }));
jest.mock('@/context/session-context', () => ({ useSession: () => ({ state: { sessions: [], attendance: [] } }) }));
jest.mock('@/data/dummy', () => ({ allUsers: [] }));
jest.mock('@/lib/useSessionFirestore', () => ({ useMyAttendance: jest.fn() }));
jest.mock('@/screens/praktikan/guard', () => ({ useUserPraktikan: () => ({ id: 'u1', name: 'Bunga', nim: '24060123' }) }));
// Kartu kesan pesan punya test sendiri; di sini cukup diketahui apakah ia dirender.
jest.mock('@/screens/praktikan/kesan-pesan/kesan-pesan-sesi', () => ({
  KesanPesanSesi: () => {
    const { Text } = jest.requireActual('react-native');
    return <Text>Kartu kesan pesan</Text>;
  },
}));
jest.mock('@/screens/praktikan/navigasi', () => ({
  bukaJadwal: jest.fn(),
  bukaPresensi: jest.fn(),
  bukaRiwayat: jest.fn(),
}));
jest.mock('@/screens/praktikan/components/layar', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Layar: ({ children, footer }: { children: unknown; footer?: unknown }) => (
      <View>
        {children}
        {footer}
      </View>
    ),
  };
});

const SESI = {
  id: 's1',
  classId: 'c1',
  title: 'Basis Data',
  date: '2026-11-23',
  startTime: '08:00',
  endTime: '09:40',
  room: 'A201',
  assistantId: 'a1',
  status: 'open',
  laboratoryId: 'lab-a',
  createdAt: null,
} as FirestoreSession;

function siapkan(session: FirestoreSession, myRecord: unknown = null) {
  jest.mocked(useMyAttendance).mockReturnValue({
    session,
    sessionLoading: false,
    myRecord: myRecord as never,
  });
}

describe('<DetailSesiScreen /> Sprint 3', () => {
  it('mengarahkan ke halaman presensi saat sesi dibuka, tanpa sheet presensi', async () => {
    siapkan(SESI);
    const { getByText, queryByText } = await render(<DetailSesiScreen />);

    await fireEvent.press(getByText('Buka halaman presensi'));
    expect(bukaPresensi).toHaveBeenCalledWith('s1');
    expect(queryByText('Ya, presensi sekarang')).toBeNull();
  });

  it.each([
    ['scheduled', 'Sesi belum dibuka'],
    ['closed', 'Sesi sudah ditutup'],
  ] as const)('menonaktifkan tombol dengan alasan saat sesi %s', async (status, alasan) => {
    siapkan({ ...SESI, status });
    const { getByText } = await render(<DetailSesiScreen />);

    expect(getByText(alasan)).toBeTruthy();
    await fireEvent.press(getByText('Buka halaman presensi'));
    expect(bukaPresensi).not.toHaveBeenCalled();
  });

  it('menampilkan waktu hadir dan tautan riwayat saat sudah presensi', async () => {
    siapkan(SESI, {
      id: 's1_u1',
      sessionId: 's1',
      userId: 'u1',
      userName: 'Bunga',
      userNim: '24060123',
      recordedAt: '2026-11-23T01:07:00.000Z',
    });
    const { getByText, queryByText } = await render(<DetailSesiScreen />);

    expect(getByText('08.07 WIB')).toBeTruthy();
    expect(getByText('Lihat riwayat kehadiran')).toBeTruthy();
    expect(queryByText('Buka halaman presensi')).toBeNull();
  });

  it('menampilkan nama asisten dari sesi, bukan dari data dummy', async () => {
    siapkan({ ...SESI, assistantName: 'Raka Pratama' });
    const { getByText } = await render(<DetailSesiScreen />);
    expect(getByText('Raka Pratama')).toBeTruthy();
  });

  it('menulis Belum ditentukan untuk sesi lama tanpa nama asisten', async () => {
    siapkan(SESI);
    const { getByText } = await render(<DetailSesiScreen />);
    expect(getByText('Belum ditentukan')).toBeTruthy();
  });
});

describe('<DetailSesiScreen /> kartu kesan pesan', () => {
  const HADIR = {
    id: 's1_u1',
    sessionId: 's1',
    userId: 'u1',
    userName: 'Bunga',
    userNim: '24060123',
    recordedAt: '2026-11-23T01:07:00.000Z',
  };

  it('tampil saat sesi sudah ditutup dan praktikan hadir', async () => {
    siapkan({ ...SESI, status: 'closed' }, HADIR);
    const { getByText } = await render(<DetailSesiScreen />);
    expect(getByText('Kartu kesan pesan')).toBeTruthy();
  });

  it.each([
    ['sesi masih dibuka', { ...SESI, status: 'open' }, HADIR],
    ['praktikan tidak hadir', { ...SESI, status: 'closed' }, null],
  ] as const)('tidak tampil saat %s', async (_, sesi, record) => {
    siapkan(sesi as FirestoreSession, record);
    const { queryByText } = await render(<DetailSesiScreen />);
    expect(queryByText('Kartu kesan pesan')).toBeNull();
  });
});
