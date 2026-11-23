import { Timestamp } from 'firebase/firestore';

import { mapFirebaseError } from '@/lib/firebase/errors';
import { TimestampValue } from '@/types';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Memastikan string tidak kosong setelah di-trim. */
export function requireNonEmpty(value: string, fieldLabel: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldLabel} wajib diisi.`);
  }
  return trimmed;
}

/** Mengonversi TimestampValue menjadi objek Date (aman untuk nilai null/undefined). */
export function toDate(value: TimestampValue | null | undefined): Date {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return value.toDate();
}

/**
 * Mengubah nilai waktu dari Firestore (Timestamp, string ISO, atau Date)
 * menjadi ISO 8601. Mengembalikan null untuk nilai yang tidak dikenali.
 */
export function toIsoString(value: unknown): string | null {
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else if (value !== null && typeof value === 'object' && 'toDate' in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === 'function') {
      try {
        const converted = candidate.toDate();
        date = converted instanceof Date ? converted : null;
      } catch {
        return null;
      }
    }
  }

  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

/** Mengonversi TimestampValue menjadi epoch milidetik untuk pengurutan. */
export function toMillis(value: TimestampValue | null | undefined): number {
  const ms = toDate(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** Mengonversi TimestampValue menjadi Firestore Timestamp. */
export function toFirestoreTimestamp(value: TimestampValue): Timestamp {
  if (value instanceof Timestamp) return value;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Tanggal tidak valid.');
  }
  return Timestamp.fromDate(date);
}

/** Memformat TimestampValue ke tanggal ringkas Indonesia (WIB). */
export function formatShortDate(value: TimestampValue | null | undefined): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Memvalidasi input tanggal YYYY-MM-DD dan mengembalikan ISO string WIB. */
export function parseDateInput(value: string): string {
  const trimmed = requireNonEmpty(value, 'Tanggal sesi');
  const match = DATE_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error('Format tanggal harus YYYY-MM-DD (contoh: 2026-11-20).');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new Error('Tanggal kalender tidak valid.');
  }

  return `${trimmed}T00:00:00+07:00`;
}

/** Mengubah TimestampValue menjadi string YYYY-MM-DD (WIB) untuk input form. */
export function toDateInputValue(value: TimestampValue | null | undefined): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Memeriksa apakah format waktu valid (HH:mm, 24 jam). */
export function isValidTimeString(time: string): boolean {
  return TIME_PATTERN.test(time.trim());
}

/** Memvalidasi rentang jam mulai dan jam selesai sesi. */
export function validateTimeRange(startTime: string, endTime: string): {
  startTime: string;
  endTime: string;
} {
  const start = requireNonEmpty(startTime, 'Jam mulai');
  const end = requireNonEmpty(endTime, 'Jam selesai');

  if (!isValidTimeString(start)) {
    throw new Error('Format jam mulai harus HH:mm (contoh: 08:00).');
  }
  if (!isValidTimeString(end)) {
    throw new Error('Format jam selesai harus HH:mm (contoh: 10:00).');
  }
  if (start >= end) {
    throw new Error('Jam selesai harus lebih akhir dari jam mulai.');
  }

  return { startTime: start, endTime: end };
}

/** Memetakan error Firebase ke pesan jelas sambil mempertahankan pesan validasi lokal. */
export function rethrowServiceError(error: unknown): never {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    throw new Error(mapFirebaseError(error).message);
  }
  if (error instanceof Error) throw error;
  throw new Error('Terjadi kesalahan. Coba lagi.');
}
