import { fireEvent, render } from '@testing-library/react-native';

import { ErrorState } from './ErrorState';

describe('<ErrorState />', () => {
  it('menampilkan judul default dan pesan', async () => {
    const { getByText } = await render(<ErrorState message="Gagal memuat jadwal." />);

    expect(getByText('Terjadi kesalahan')).toBeTruthy();
    expect(getByText('Gagal memuat jadwal.')).toBeTruthy();
  });

  it('memakai judul kustom dan menjalankan aksi retry', async () => {
    const onRetry = jest.fn();
    const { getByText } = await render(
      <ErrorState title="Koneksi terputus" message="Periksa jaringan." onRetry={onRetry} />
    );

    expect(getByText('Koneksi terputus')).toBeTruthy();
    await fireEvent.press(getByText('Coba lagi'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('menjalankan aksi sekunder bila disediakan', async () => {
    const onSecondary = jest.fn();
    const { getByText } = await render(
      <ErrorState
        message="Profil tidak ditemukan."
        onSecondary={onSecondary}
        secondaryLabel="Keluar"
      />
    );

    await fireEvent.press(getByText('Keluar'));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('tidak menampilkan tombol yang tidak dikonfigurasi', async () => {
    const { queryByText } = await render(<ErrorState message="Gagal." />);

    expect(queryByText('Coba lagi')).toBeNull();
    expect(queryByText('Keluar')).toBeNull();
  });
});
