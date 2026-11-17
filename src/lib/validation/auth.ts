import type { RegisterInput } from '@/types';

export interface AuthFieldErrors {
  name?: string;
  nim?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIM_PATTERN = /^\d{6,15}$/;

export function validateRegisterInput(input: RegisterInput): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (input.name.trim().length < 2) {
    errors.name = 'Nama minimal 2 karakter.';
  }
  if (!NIM_PATTERN.test(input.nim.trim())) {
    errors.nim = 'NIM harus 6–15 digit.';
  }
  if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = 'Format email tidak valid.';
  }
  if (input.password.length < 6) {
    errors.password = 'Password minimal 6 karakter.';
  }
  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password tidak sama.';
  }

  return errors;
}

export function validateLoginInput(email: string, password: string): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Format email tidak valid.';
  }
  if (!password) {
    errors.password = 'Password wajib diisi.';
  }

  return errors;
}

export function hasFieldErrors(errors: AuthFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
