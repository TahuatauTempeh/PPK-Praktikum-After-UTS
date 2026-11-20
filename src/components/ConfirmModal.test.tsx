import { fireEvent, render } from '@testing-library/react-native';

import { ConfirmModal } from './ConfirmModal';

describe('<ConfirmModal />', () => {
  it('menampilkan judul dan pesan saat terlihat', async () => {
    const { getByText } = await render(
      <ConfirmModal
        visible
        title="Buka sesi?"
        message="Praktikan dapat melakukan presensi setelah sesi dibuka."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(getByText('Buka sesi?')).toBeTruthy();
    expect(getByText('Praktikan dapat melakukan presensi setelah sesi dibuka.')).toBeTruthy();
  });

  it('memanggil onCancel dan onConfirm dari tombol yang sesuai', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByText } = await render(
      <ConfirmModal
        visible
        title="Tutup sesi?"
        message="Sesi yang ditutup tidak bisa dibuka lagi."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await fireEvent.press(getByText('Batal'));
    await fireEvent.press(getByText('Konfirmasi'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('memakai label tombol kustom', async () => {
    const { getByText } = await render(
      <ConfirmModal
        visible
        title="Hapus sesi?"
        message="Data presensi tetap tersimpan."
        confirmText="Hapus"
        cancelText="Batal"
        confirmColor="danger"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(getByText('Hapus')).toBeTruthy();
  });
});
