export interface AppError {
  code: string;
  message: string;
  cause?: unknown;
}

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email atau password salah.',
  'auth/user-not-found': 'Akun tidak ditemukan.',
  'auth/wrong-password': 'Password salah.',
  'auth/email-already-in-use': 'Email sudah terdaftar.',
  'auth/weak-password': 'Password minimal 6 karakter.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti.',
  'auth/network-request-failed': 'Koneksi internet bermasalah.',
  'auth/operation-not-allowed': 'Metode login belum diaktifkan.',

  'permission-denied': 'Kamu tidak punya akses untuk tindakan ini.',
  'unavailable': 'Layanan sedang tidak tersedia. Coba lagi.',
  'not-found': 'Data tidak ditemukan.',
  'already-exists': 'Data sudah ada.',
  'failed-precondition': 'Operasi tidak bisa dilakukan saat ini.',
  'resource-exhausted': 'Terlalu banyak permintaan. Coba lagi.',
  'unauthenticated': 'Sesi login sudah berakhir. Silakan masuk lagi.',
  'invalid-argument': 'Permintaan tidak valid.',
  'cancelled': 'Operasi dibatalkan.',
  'deadline-exceeded': 'Operasi melewati batas waktu. Coba lagi.',
  'internal': 'Terjadi kesalahan pada layanan. Coba lagi.',
  'data-loss': 'Data tidak dapat dibaca. Hubungi admin.',
};

function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return 'unknown';
}

function normalizeCode(code: string): string {
  return code.startsWith('firestore/') ? code.slice('firestore/'.length) : code;
}

export function mapFirebaseError(error: unknown): AppError {
  const code = getErrorCode(error);
  const normalizedCode = normalizeCode(code);

  console.warn('[firebase]', normalizedCode, error);

  return {
    code,
    message: MESSAGES[code] ?? MESSAGES[normalizedCode] ?? 'Terjadi kesalahan. Coba lagi.',
    cause: error,
  };
}
