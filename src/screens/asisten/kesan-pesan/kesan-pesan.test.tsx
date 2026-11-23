import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { pantauKesanPesanSesi, pantauSemuaKesanPesan, type KesanPesan } from '@/lib/kesan-pesan-service';

import DaftarKesanPesan from './daftar-kesan-pesan';
import KesanPesanPerSesi from './kesan-pesan-per-sesi';
import { LabelAi } from './label-ai';

jest.mock('@/lib/kesan-pesan-service', () => ({
  pantauKesanPesanSesi: jest.fn(),
  pantauSemuaKesanPesan: jest.fn(),
}));
jest.mock('../izin/use-sesi-izin', () => ({
  useSesiIzin: () => ({
    keadaan: 'siap',
    sessions: [
      { id: 's1', course: 'Dasar Pemrograman', title: 'Lambda', date: '2026-11-23', time: '10:00 - 12:30', room: 'Lab Komputer D' },
    ],
  }),
}));
jest.mock('../components/assistant-screen', () => {
  const { View } = jest.requireActual('react-native');
  return {
    AssistantScreen: ({ children, header }: { children: unknown; header?: unknown }) => (
      <View>
        {header}
        {children}
      </View>
    ),
  };
});
jest.mock('@/screens/shared/izin', () => ({
  formatWaktuIzin: () => '23 Nov 2026, 11.05 WIB',
  namaSesi: (session: { course: string; title: string } | undefined) =>
    session ? `${session.course}, ${session.title}` : 'Sesi tidak ditemukan',
}));

function isian(id: string, ubah: Partial<KesanPesan> = {}): KesanPesan {
  return {
    id,
    sessionId: 's1',
    classId: 'c1',
    userId: id,
    userName: `Praktikan ${id}`,
    text: 'Asisten menjelaskan dengan sabar.',
    aiLabel: 'positif',
    aiConfidence: 0.8,
    createdAt: null,
    ...ubah,
  };
}

describe('<LabelAi />', () => {
  it.each([
    ['positif', 'Positif'],
    ['netral', 'Netral'],
    ['negatif', 'Negatif'],
    [null, 'Hasil AI tidak tersedia'],
  ] as const)('menampilkan label %s sebagai teks', async (label, teks) => {
    const { getByText, getByLabelText } = await render(<LabelAi label={label} />);
    expect(getByText(teks)).toBeTruthy();
    expect(getByLabelText(`Analisis AI: ${teks}`)).toBeTruthy();
  });
});

describe('<KesanPesanPerSesi />', () => {
  it('menampilkan tiap kesan pesan beserta label AI dan keterangan perkiraan', async () => {
    let kirim: (daftar: KesanPesan[]) => void = () => {};
    jest.mocked(pantauKesanPesanSesi).mockImplementation((_id, onData) => {
      kirim = onData;
      return jest.fn();
    });
    const { getByText, getAllByText } = await render(<KesanPesanPerSesi sessionId="s1" onBack={jest.fn()} />);

    await act(async () =>
      kirim([isian('u1'), isian('u2', { text: 'Waktunya kurang dan membingungkan.', aiLabel: 'negatif' }), isian('u3', { aiLabel: null })])
    );

    expect(getByText('Dasar Pemrograman, Lambda')).toBeTruthy();
    expect(getByText('3 kesan pesan')).toBeTruthy();
    expect(getByText('Perkiraan nada kesan pesan dari model sentimen, bukan penilaian pasti.')).toBeTruthy();
    expect(getByText('Waktunya kurang dan membingungkan.')).toBeTruthy();
    expect(getByText('Positif')).toBeTruthy();
    expect(getByText('Negatif')).toBeTruthy();
    expect(getByText('Hasil AI tidak tersedia')).toBeTruthy();
    expect(getAllByText('Analisis AI')).toHaveLength(3);
  });

  it('menampilkan galat dan memuat ulang saat Coba lagi ditekan', async () => {
    let gagal: (pesan: string) => void = () => {};
    jest.mocked(pantauKesanPesanSesi).mockImplementation((_id, _onData, onError) => {
      gagal = onError;
      return jest.fn();
    });
    const { getByText } = await render(<KesanPesanPerSesi sessionId="s1" onBack={jest.fn()} />);

    await act(async () => gagal('Koneksi internet bermasalah.'));
    expect(getByText('Gagal memuat kesan pesan')).toBeTruthy();

    const sebelum = jest.mocked(pantauKesanPesanSesi).mock.calls.length;
    await fireEvent.press(getByText('Coba lagi'));
    expect(jest.mocked(pantauKesanPesanSesi).mock.calls.length).toBeGreaterThan(sebelum);
  });
});

describe('<DaftarKesanPesan />', () => {
  it('mengelompokkan kesan pesan per sesi dan membuka sesi yang dipilih', async () => {
    let kirim: (daftar: KesanPesan[]) => void = () => {};
    jest.mocked(pantauSemuaKesanPesan).mockImplementation((onData) => {
      kirim = onData;
      return jest.fn();
    });
    const onOpen = jest.fn();
    const { getByText, getByLabelText } = await render(<DaftarKesanPesan onBack={jest.fn()} onOpen={onOpen} />);

    await act(async () => kirim([isian('u1'), isian('u2'), isian('u3', { sessionId: 's9' })]));

    expect(getByText(/2 kesan pesan/)).toBeTruthy();
    expect(getByText('Sesi tidak ditemukan')).toBeTruthy();
    await fireEvent.press(getByLabelText('Lihat kesan pesan Dasar Pemrograman, Lambda'));
    expect(onOpen).toHaveBeenCalledWith('s1');
  });

  it('menampilkan keadaan kosong', async () => {
    let kirim: (daftar: KesanPesan[]) => void = () => {};
    jest.mocked(pantauSemuaKesanPesan).mockImplementation((onData) => {
      kirim = onData;
      return jest.fn();
    });
    const { getByText } = await render(<DaftarKesanPesan onBack={jest.fn()} onOpen={jest.fn()} />);

    await act(async () => kirim([]));
    expect(getByText('Belum ada kesan pesan')).toBeTruthy();
  });
});
