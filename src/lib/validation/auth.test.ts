import {
  hasFieldErrors,
  validateLoginInput,
  validateRegisterInput,
} from './auth';

const validRegister = {
  name: 'Bunga Maharani',
  nim: '231110002',
  email: 'bunga@example.com',
  password: 'rahasia123',
  confirmPassword: 'rahasia123',
};

describe('validateRegisterInput', () => {
  it('menerima input registrasi yang valid', () => {
    expect(validateRegisterInput(validRegister)).toEqual({});
  });

  it('menolak nama yang terlalu pendek', () => {
    expect(validateRegisterInput({ ...validRegister, name: ' A ' }).name).toBe(
      'Nama minimal 2 karakter.'
    );
  });

  it('menolak NIM yang bukan 6–15 digit', () => {
    expect(validateRegisterInput({ ...validRegister, nim: '12ab' }).nim).toBe(
      'NIM harus 6–15 digit.'
    );
    expect(validateRegisterInput({ ...validRegister, nim: '123' }).nim).toBe(
      'NIM harus 6–15 digit.'
    );
  });

  it('menolak email yang tidak valid', () => {
    expect(validateRegisterInput({ ...validRegister, email: 'bunga@' }).email).toBe(
      'Format email tidak valid.'
    );
  });

  it('menolak password pendek dan konfirmasi yang berbeda', () => {
    const errors = validateRegisterInput({
      ...validRegister,
      password: '123',
      confirmPassword: '456',
    });

    expect(errors.password).toBe('Password minimal 6 karakter.');
    expect(errors.confirmPassword).toBe('Konfirmasi password tidak sama.');
  });
});

describe('validateLoginInput', () => {
  it('menerima email dan password yang terisi', () => {
    expect(validateLoginInput('bunga@example.com', 'rahasia123')).toEqual({});
  });

  it('menolak email tidak valid dan password kosong', () => {
    const errors = validateLoginInput('bukan-email', '');

    expect(errors.email).toBe('Format email tidak valid.');
    expect(errors.password).toBe('Password wajib diisi.');
  });
});

describe('hasFieldErrors', () => {
  it('membedakan hasil validasi kosong dan berisi', () => {
    expect(hasFieldErrors({})).toBe(false);
    expect(hasFieldErrors({ email: 'Format email tidak valid.' })).toBe(true);
  });
});
