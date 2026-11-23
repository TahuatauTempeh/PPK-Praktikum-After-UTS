import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { kirimKesanPesan, pantauKesanPesanSaya, type KesanPesan } from '@/lib/kesan-pesan-service';

import { KesanPesanSesi } from './kesan-pesan-sesi';

jest.mock('@/lib/kesan-pesan-service', () => ({
  TEKS_MIN: 10,
  TEKS_MAKS: 500,
  kirimKesanPesan: jest.fn(),
  pantauKesanPesanSaya: jest.fn(),
  pesanGalatKesanPesan: (error: Error) => error.message,
}));
jest.mock('@/screens/shared/izin', () => ({ formatWaktuIzin: () => '23 Nov 2026, 11.05 WIB' }));

const USER = { id: 'u1', name: 'Bunga' };

let kirimData: (daftar: KesanPesan[]) => void;
let kirimGalat: (pesan: string) => void;

beforeEach(() => {
  jest.mocked(pantauKesanPesanSaya).mockImplementation((_uid, onData, onError) => {
    kirimData = onData;
    kirimGalat = onError;
    return jest.fn();
  });
});

async function tampil() {
  const hasil = await render(<KesanPesanSesi sessionId="s1" user={USER} />);
  return hasil;
}

const TERKIRIM: KesanPesan = {
  id: 's1_u1',
  sessionId: 's1',
  classId: 'c1',
  userId: 'u1',
  userName: 'Bunga',
  text: 'Asisten menjelaskan dengan sabar.',
  aiLabel: 'positif',
  aiConfidence: 0.81,
  createdAt: null,
};

describe('<KesanPesanSesi />', () => {
  it('menampilkan status memuat lalu tombol untuk menulis', async () => {
    const { getByText } = await tampil();
    expect(getByText('Memuat kesan pesan...')).toBeTruthy();

    await act(async () => kirimData([]));
    expect(getByText('Tulis kesan pesan')).toBeTruthy();
  });

  it('menolak teks yang terlalu pendek tanpa mengirim', async () => {
    const { getByText, getByLabelText } = await tampil();
    await act(async () => kirimData([]));

    await fireEvent.press(getByText('Tulis kesan pesan'));
    await fireEvent.changeText(getByLabelText('Kesan dan pesan'), 'singkat');
    await fireEvent.press(getByText('Kirim kesan pesan'));

    expect(getByText('Kesan pesan minimal 10 karakter.')).toBeTruthy();
    expect(kirimKesanPesan).not.toHaveBeenCalled();
  });

  it('mengirim kesan pesan lalu menutup form', async () => {
    jest.mocked(kirimKesanPesan).mockResolvedValue(TERKIRIM);
    const { getByText, getByLabelText, queryByLabelText } = await tampil();
    await act(async () => kirimData([]));

    await fireEvent.press(getByText('Tulis kesan pesan'));
    await fireEvent.changeText(getByLabelText('Kesan dan pesan'), 'Asisten menjelaskan dengan sabar.');
    await fireEvent.press(getByText('Kirim kesan pesan'));

    expect(kirimKesanPesan).toHaveBeenCalledWith({
      sessionId: 's1',
      userId: 'u1',
      userName: 'Bunga',
      text: 'Asisten menjelaskan dengan sabar.',
    });
    expect(queryByLabelText('Kesan dan pesan')).toBeNull();
  });

  it('menampilkan pesan galat saat pengiriman ditolak', async () => {
    jest.mocked(kirimKesanPesan).mockRejectedValue(new Error('Kesan pesan baru bisa dikirim setelah sesi ditutup asisten.'));
    const { getByText, getByLabelText } = await tampil();
    await act(async () => kirimData([]));

    await fireEvent.press(getByText('Tulis kesan pesan'));
    await fireEvent.changeText(getByLabelText('Kesan dan pesan'), 'Asisten menjelaskan dengan sabar.');
    await fireEvent.press(getByText('Kirim kesan pesan'));

    expect(getByText('Kesan pesan baru bisa dikirim setelah sesi ditutup asisten.')).toBeTruthy();
  });

  it('menampilkan kesan pesan yang sudah dikirim tanpa label AI', async () => {
    const { getByText, queryByText } = await tampil();
    await act(async () => kirimData([TERKIRIM]));

    expect(getByText('Kesan dan pesan kamu')).toBeTruthy();
    expect(getByText('Asisten menjelaskan dengan sabar.')).toBeTruthy();
    expect(getByText('Dikirim 23 Nov 2026, 11.05 WIB')).toBeTruthy();
    expect(queryByText(/positif/i)).toBeNull();
    expect(queryByText('Tulis kesan pesan')).toBeNull();
  });

  it('mengabaikan kesan pesan dari sesi lain', async () => {
    const { getByText } = await tampil();
    await act(async () => kirimData([{ ...TERKIRIM, sessionId: 's2' }]));
    expect(getByText('Tulis kesan pesan')).toBeTruthy();
  });

  it('menampilkan galat saat data gagal dimuat', async () => {
    const { getByText } = await tampil();
    await act(async () => kirimGalat('Koneksi internet bermasalah.'));
    expect(getByText('Kesan pesan gagal dimuat. Koneksi internet bermasalah.')).toBeTruthy();
  });
});
