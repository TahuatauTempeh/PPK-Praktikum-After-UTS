import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { kelayakanPresensi, type InputKelayakan } from '@/lib/attendance-rules';

import type { PresensiAksi, PresensiViewModel, SesiPresensiTampil } from './presensi-model';
import PresensiScreen, { PresensiTampilan } from './presensi-screen';
import { usePresensi } from './use-presensi';

jest.mock('expo-router', () => ({
  router: { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 's1' }),
}));
jest.mock('@/context/auth-context', () => ({ useAuth: () => ({ profile: { id: 'u1' } }) }));
jest.mock('@/screens/praktikan/guard', () => ({ useUserPraktikan: () => ({ id: 'u1' }) }));
jest.mock('@/screens/praktikan/navigasi', () => ({ bukaRiwayat: jest.fn() }));
jest.mock('./use-presensi', () => ({ usePresensi: jest.fn() }));

// Layar bergantung pada router dan context tab bar; yang diuji di sini isi halamannya.
jest.mock('@/screens/praktikan/components/layar', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Layar: ({ children, footer, overlay }: { children: unknown; footer?: unknown; overlay?: unknown }) => (
      <View>
        {children}
        {footer}
        {overlay}
      </View>
    ),
  };
});

const SESI: SesiPresensiTampil = {
  id: 's1',
  judul: 'Basis Data',
  kelas: 'IF-3A',
  tanggal: '2026-11-23',
  waktu: '08:00 - 09:40',
  ruang: 'A201',
  laboratorium: 'Lab A201',
  asisten: 'Raka Pratama',
  status: 'open',
};

const LAB = { isActive: true, latitude: -7.05, longitude: 110.44, radiusMeters: 100 };

function model(ubah: Partial<PresensiViewModel> = {}, input: Partial<InputKelayakan> = {}): PresensiViewModel {
  return {
    sesi: SESI,
    galatMuat: null,
    kelayakan: kelayakanPresensi({
      sesi: { status: 'open' },
      terdaftar: true,
      lab: LAB,
      jamPresensi: null,
      lokasi: { tahap: 'siap', posisi: { accuracyMeters: 12, mocked: false }, distanceMeters: 23 },
      ...input,
    }),
    ukuran: { distanceMeters: 23, radiusMeters: 100, accuracyMeters: 12 },
    catatan: null,
    kirim: { tahap: 'diam' },
    ...ubah,
  };
}

function aksi(): jest.Mocked<PresensiAksi> {
  return {
    onKembali: jest.fn(),
    onAksiLokasi: jest.fn(),
    onKirim: jest.fn(),
    onMuatUlang: jest.fn(),
    onLihatRiwayat: jest.fn(),
  };
}

describe('<PresensiTampilan />', () => {
  it('menampilkan identitas sesi dengan status berupa teks', async () => {
    const { getByText } = await render(<PresensiTampilan model={model()} aksi={aksi()} />);

    expect(getByText('Basis Data')).toBeTruthy();
    expect(getByText('Kelas IF-3A')).toBeTruthy();
    expect(getByText('A201 · Lab A201')).toBeTruthy();
    expect(getByText('Dibuka')).toBeTruthy();
  });

  it('meminta konfirmasi singkat sebelum mengirim presensi', async () => {
    const a = aksi();
    const { getByText, queryByText } = await render(<PresensiTampilan model={model()} aksi={a} />);

    await fireEvent.press(getByText('Presensi sekarang'));
    expect(a.onKirim).not.toHaveBeenCalled();
    expect(getByText('Apakah kamu yakin ingin presensi sekarang?')).toBeTruthy();
    expect(queryByText('Posisi kamu: 23 m dari Lab A201, akurasi ±12 m')).toBeNull();

    await fireEvent.press(getByText('Ya'));
    expect(a.onKirim).toHaveBeenCalledTimes(1);
  });

  it('menonaktifkan tombol dan menyembunyikan radius saat di luar area absen', async () => {
    const a = aksi();
    const m = model(
      { ukuran: { distanceMeters: 140, radiusMeters: 100, accuracyMeters: 12 } },
      { lokasi: { tahap: 'siap', posisi: { accuracyMeters: 12, mocked: false }, distanceMeters: 140 } }
    );
    const { getAllByText, getByText, queryByText } = await render(<PresensiTampilan model={m} aksi={a} />);

    expect(getAllByText('Kamu berada di luar area absen.').length).toBeGreaterThan(0);
    expect(queryByText('Radius')).toBeNull();
    expect(queryByText('100 m')).toBeNull();

    await fireEvent.press(getByText('Presensi sekarang'));
    expect(queryByText('Konfirmasi presensi')).toBeNull();
    expect(a.onKirim).not.toHaveBeenCalled();
  });

  it('memberi aksi pengaturan dan periksa lagi saat izin diblokir', async () => {
    const a = aksi();
    const m = model(
      { ukuran: { distanceMeters: null, radiusMeters: 100, accuracyMeters: null } },
      { lokasi: { tahap: 'izin', izin: 'blocked' } }
    );
    const { getByText } = await render(<PresensiTampilan model={m} aksi={a} />);

    await fireEvent.press(getByText('Buka pengaturan'));
    await fireEvent.press(getByText('Periksa lagi'));
    expect(a.onAksiLokasi.mock.calls).toEqual([['buka-pengaturan'], ['periksa-lagi']]);
  });

  it('meminta izin lokasi saat belum pernah diminta', async () => {
    const a = aksi();
    const m = model({}, { lokasi: { tahap: 'izin', izin: 'undetermined' } });
    const { getByText } = await render(<PresensiTampilan model={m} aksi={a} />);

    expect(getByText('Izin lokasi diperlukan untuk memastikan kamu berada di laboratorium.')).toBeTruthy();
    await fireEvent.press(getByText('Izinkan lokasi'));
    expect(a.onAksiLokasi).toHaveBeenCalledWith('izinkan');
  });

  it('menampilkan hasil sukses dari server dan menyembunyikan tombol presensi', async () => {
    const m = model({ kirim: { tahap: 'berhasil', jam: '08.07', distanceMeters: 23, radiusMeters: 100 } });
    const { getByText, queryByText } = await render(<PresensiTampilan model={m} aksi={aksi()} />);

    expect(getByText('Presensi berhasil')).toBeTruthy();
    expect(getByText('Tercatat pukul 08.07 WIB · 23 m dari Lab A201')).toBeTruthy();
    expect(getByText('Lihat riwayat kehadiran')).toBeTruthy();
    expect(queryByText('Presensi sekarang')).toBeNull();
    expect(queryByText('Pemeriksaan lokasi')).toBeNull();
  });

  it('menampilkan notice gagal dan tombol coba lagi tanpa status sukses', async () => {
    const m = model({ kirim: { tahap: 'gagal', pesan: 'Koneksi bermasalah. Presensi tidak tercatat. Coba lagi.' } });
    const { getByText, queryByText } = await render(<PresensiTampilan model={m} aksi={aksi()} />);

    expect(getByText('Koneksi bermasalah. Presensi tidak tercatat. Coba lagi.')).toBeTruthy();
    expect(getByText('Coba presensi lagi')).toBeTruthy();
    expect(queryByText('Presensi berhasil')).toBeNull();
  });

  it('menandai presensi lama tanpa bukti lokasi', async () => {
    const m = model(
      { catatan: { jam: '08.05', adaBuktiLokasi: false, distanceMeters: null } },
      { jamPresensi: '08.05' }
    );
    const { getByText } = await render(<PresensiTampilan model={m} aksi={aksi()} />);

    expect(getByText('Sudah presensi')).toBeTruthy();
    expect(getByText('08.05 WIB')).toBeTruthy();
    expect(getByText('Presensi lama, tanpa bukti lokasi')).toBeTruthy();
  });

  it('menjelaskan sesi yang sudah ditutup tanpa memeriksa lokasi', async () => {
    const m = model({ sesi: { ...SESI, status: 'closed' } }, { sesi: { status: 'closed' } });
    const { getByText, queryByText, getAllByText } = await render(<PresensiTampilan model={m} aksi={aksi()} />);

    expect(getByText('Sesi sudah ditutup. Presensi tidak dapat dilakukan.')).toBeTruthy();
    expect(getAllByText('Sesi sudah ditutup').length).toBeGreaterThan(0);
    expect(queryByText('Pemeriksaan lokasi')).toBeNull();
  });

  it('menampilkan state memuat', async () => {
    const { getByText } = await render(<PresensiTampilan model={model({ sesi: undefined })} aksi={aksi()} />);
    expect(getByText('Memuat sesi...')).toBeTruthy();
  });

  it('menampilkan state sesi tidak ditemukan dengan jalan kembali', async () => {
    const a = aksi();
    const { getByText } = await render(<PresensiTampilan model={model({ sesi: null })} aksi={a} />);

    expect(getByText('Sesi tidak ditemukan')).toBeTruthy();
    await fireEvent.press(getByText('Kembali'));
    expect(a.onKembali).toHaveBeenCalledTimes(1);
  });

  it('menampilkan state gagal memuat dengan tombol muat ulang', async () => {
    const a = aksi();
    const { getByText } = await render(
      <PresensiTampilan model={model({ galatMuat: 'Koneksi internet bermasalah.' })} aksi={a} />
    );

    expect(getByText('Koneksi internet bermasalah.')).toBeTruthy();
    await fireEvent.press(getByText('Muat ulang'));
    expect(a.onMuatUlang).toHaveBeenCalledTimes(1);
  });
});

describe('<PresensiScreen />', () => {
  it('memuat sesi dari parameter route dan meneruskan aksi kirim', async () => {
    const onKirim = jest.fn();
    jest.mocked(usePresensi).mockReturnValue({
      model: model(),
      onAksiLokasi: jest.fn(),
      onKirim,
      onMuatUlang: jest.fn(),
    });
    const { getByText } = await render(<PresensiScreen />);

    expect(jest.mocked(usePresensi)).toHaveBeenCalledWith('s1', { id: 'u1' });
    await fireEvent.press(getByText('Presensi sekarang'));
    await fireEvent.press(getByText('Ya'));
    expect(onKirim).toHaveBeenCalledTimes(1);
  });
});
