import { mapFirebaseError } from './errors';

describe('mapFirebaseError', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('memetakan kode Firebase yang dikenal ke pesan Indonesia', () => {
    expect(mapFirebaseError({ code: 'auth/invalid-credential' })).toEqual({
      code: 'auth/invalid-credential',
      message: 'Email atau password salah.',
      cause: { code: 'auth/invalid-credential' },
    });

    expect(mapFirebaseError({ code: 'firestore/permission-denied' }).message).toBe(
      'Kamu tidak punya akses untuk tindakan ini.'
    );
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
