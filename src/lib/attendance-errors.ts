/**
 * Pemetaan hasil gagal presensi berbasis lokasi (PRD Sprint 3, SRS 9.2).
 * Callable `submitAttendance` mengirim kode domain lewat `details.code`;
 * file ini mengubahnya menjadi AttendanceSubmitResult dengan pesan Bahasa Indonesia.
 */

// SEMENTARA: salinan kontrak PRD Lampiran C 3.1. Setelah Dev 1 menambahkannya ke
// `src/types/index.ts`, hapus kedua tipe ini dan impor dari `@/types`.
export type AttendanceFailureCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_OPEN'
  | 'NOT_ENROLLED'
  | 'LAB_NOT_SET'
  | 'LAB_INACTIVE'
  | 'OUT_OF_RADIUS'
  | 'LOCATION_INACCURATE'
  | 'MOCK_LOCATION'
  | 'ALREADY_PRESENT'
  | 'NETWORK'
  | 'UNKNOWN';

export type AttendanceSubmitResult =
  | {
      ok: true;
      recordedAt: string;
      distanceMeters: number;
      radiusMeters: number;
    }
  | {
      ok: false;
      code: AttendanceFailureCode;
      message: string;
      distanceMeters?: number;
      radiusMeters?: number;
    };

export type AttendanceFailure = Extract<AttendanceSubmitResult, { ok: false }>;

export interface DetailGagal {
  distanceMeters?: number;
  radiusMeters?: number;
  /** Nama lab untuk pesan luar radius, mis. "Lab A201" */
  laboratoryName?: string;
}

/** Kode yang hanya boleh datang dari `details.code` callable */
const KODE_DOMAIN: readonly AttendanceFailureCode[] = [
  'SESSION_NOT_FOUND',
  'SESSION_NOT_OPEN',
  'NOT_ENROLLED',
  'LAB_NOT_SET',
  'LAB_INACTIVE',
  'OUT_OF_RADIUS',
  'LOCATION_INACCURATE',
  'MOCK_LOCATION',
  'ALREADY_PRESENT',
];

const PESAN_TETAP: Record<Exclude<AttendanceFailureCode, 'OUT_OF_RADIUS'>, string> = {
  SESSION_NOT_FOUND: 'Sesi tidak ditemukan.',
  SESSION_NOT_OPEN: 'Sesi belum dibuka atau sudah ditutup.',
  NOT_ENROLLED: 'Kamu tidak terdaftar di sesi ini.',
  LAB_NOT_SET: 'Laboratorium sesi belum diatur.',
  LAB_INACTIVE: 'Laboratorium sedang tidak aktif.',
  LOCATION_INACCURATE: 'Akurasi lokasi rendah. Tunggu sebentar lalu coba lagi.',
  MOCK_LOCATION: 'Lokasi palsu terdeteksi. Matikan aplikasi pengubah lokasi lalu coba lagi.',
  ALREADY_PRESENT: 'Kamu sudah presensi di sesi ini.',
  NETWORK: 'Koneksi bermasalah. Presensi tidak tercatat. Coba lagi.',
  UNKNOWN: 'Terjadi kesalahan. Presensi tidak tercatat. Coba lagi.',
};

const PESAN_SESI_BERAKHIR = 'Sesi login sudah berakhir. Silakan masuk kembali.';

function angkaValid(nilai: unknown): nilai is number {
  return typeof nilai === 'number' && Number.isFinite(nilai) && nilai >= 0;
}

function meter(nilai: number): string {
  return `${Math.round(nilai)} m`;
}

export function pesanGagalPresensi(code: AttendanceFailureCode, detail: DetailGagal = {}): string {
  if (code !== 'OUT_OF_RADIUS') return PESAN_TETAP[code];

  const { distanceMeters, radiusMeters, laboratoryName } = detail;
  if (!angkaValid(distanceMeters) || !angkaValid(radiusMeters)) {
    return 'Kamu berada di luar radius laboratorium.';
  }
  const tujuan = laboratoryName?.trim() ? laboratoryName.trim() : 'laboratorium';
  return `Kamu berada ${meter(distanceMeters)} dari ${tujuan}. Radius yang diizinkan ${meter(radiusMeters)}.`;
}

export function buatGagal(code: AttendanceFailureCode, detail: DetailGagal = {}): AttendanceFailure {
  const hasil: AttendanceFailure = { ok: false, code, message: pesanGagalPresensi(code, detail) };
  if (angkaValid(detail.distanceMeters)) hasil.distanceMeters = detail.distanceMeters;
  if (angkaValid(detail.radiusMeters)) hasil.radiusMeters = detail.radiusMeters;
  return hasil;
}

function bacaKodeFirebase(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const code = (error as { code?: unknown }).code;
  if (typeof code !== 'string') return '';
  return code.startsWith('functions/') ? code.slice('functions/'.length) : code;
}

function bacaDetail(error: unknown): Record<string, unknown> {
  if (typeof error !== 'object' || error === null) return {};
  const details = (error as { details?: unknown }).details;
  return typeof details === 'object' && details !== null ? (details as Record<string, unknown>) : {};
}

/**
 * Mengubah error dari `httpsCallable` menjadi hasil gagal.
 * SDK Functions melaporkan fetch yang gagal (offline) sebagai `internal`, sama dengan
 * error 500 dari server, jadi keduanya dianggap NETWORK: presensi tidak tercatat dan
 * pengguna perlu mencoba lagi.
 */
export function hasilGagalDariGalat(error: unknown, laboratoryName?: string): AttendanceFailure {
  const detail = bacaDetail(error);
  const kodeDomain = detail.code;

  if (typeof kodeDomain === 'string' && (KODE_DOMAIN as readonly string[]).includes(kodeDomain)) {
    return buatGagal(kodeDomain as AttendanceFailureCode, {
      distanceMeters: angkaValid(detail.distanceMeters) ? detail.distanceMeters : undefined,
      radiusMeters: angkaValid(detail.radiusMeters) ? detail.radiusMeters : undefined,
      laboratoryName,
    });
  }

  switch (bacaKodeFirebase(error)) {
    case 'unavailable':
    case 'deadline-exceeded':
    case 'internal':
      return buatGagal('NETWORK');
    case 'unauthenticated':
      return { ok: false, code: 'UNKNOWN', message: PESAN_SESI_BERAKHIR };
    default:
      return buatGagal('UNKNOWN');
  }
}
