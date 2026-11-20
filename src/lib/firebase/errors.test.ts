import { mapFirebaseError } from './errors';

describe('mapFirebaseError', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it.each([
    ['auth/invalid-credential', 'Email atau password salah.'],
    ['permission-denied', 'Kamu tidak punya akses untuk tindakan ini.'],
    ['firestore/permission-denied', 'Kamu tidak punya akses untuk tindakan ini.'],
    ['unavailable', 'Layanan sedang tidak tersedia. Coba lagi.'],
    ['not-found', 'Data tidak ditemukan.'],
    ['already-exists', 'Data sudah ada.'],
    ['failed-precondition', 'Operasi tidak bisa dilakukan saat ini.'],
    ['resource-exhausted', 'Terlalu banyak permintaan. Coba lagi.'],
    ['unauthenticated', 'Sesi login sudah berakhir. Silakan masuk lagi.'],
  ])('memetakan %s', (code, message) => {
    expect(mapFirebaseError({ code }).message).toBe(message);
  });

  it('memakai pesan umum untuk kode yang tidak dikenal', () => {
    const error = mapFirebaseError({ code: 'auth/something-new' });

    expect(error.code).toBe('auth/something-new');
    expect(error.message).toBe('Terjadi kesalahan. Coba lagi.');
  });

  it('menganggap nilai tanpa kode sebagai galat tidak dikenal', () => {
    expect(mapFirebaseError(new Error('gagal')).code).toBe('unknown');
    expect(mapFirebaseError('gagal').message).toBe('Terjadi kesalahan. Coba lagi.');
    expect(mapFirebaseError(null).code).toBe('unknown');
  });
});
