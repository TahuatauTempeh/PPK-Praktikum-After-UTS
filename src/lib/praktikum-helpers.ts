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

/** Mengonversi TimestampValue menjadi objek Date. */
export function toDate(value: TimestampValue): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return value.toDate();
}

/** Mengonversi TimestampValue menjadi epoch milidetik untuk pengurutan. */
export function toMillis(value: TimestampValue): number {
  const ms = toDate(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** Memformat TimestampValue ke tanggal ringkas Indonesia (WIB). */
export function formatShortDate(value: TimestampValue): string {
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
export function toDateInputValue(value: TimestampValue): string {
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

/** Membuat ID unik sementara untuk data mock in-memory. */
export function createMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
