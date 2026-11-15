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
  'firestore/permission-denied': 'Kamu tidak punya akses untuk tindakan ini.',
  'firestore/unavailable': 'Layanan sedang tidak tersedia. Coba lagi.',
  'firestore/not-found': 'Data tidak ditemukan.',
  'firestore/already-exists': 'Data sudah ada.',
  'firestore/failed-precondition': 'Operasi tidak bisa dilakukan saat ini.',
  'firestore/resource-exhausted': 'Terlalu banyak permintaan. Coba lagi.',
};

function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return 'unknown';
}

export function mapFirebaseError(error: unknown): AppError {
  const code = getErrorCode(error);
  console.warn('[firebase]', code, error);
  return {
    code,
    message: MESSAGES[code] ?? 'Terjadi kesalahan. Coba lagi.',
    cause: error,
  };
}
