import { Timestamp } from 'firebase/firestore';

import {
  formatShortDate,
  isValidTimeString,
  parseDateInput,
  rethrowServiceError,
  requireNonEmpty,
  toDate,
  toDateInputValue,
  toFirestoreTimestamp,
  toMillis,
  validateTimeRange,
} from './praktikum-helpers';

jest.mock('firebase/firestore', () => {
  class Timestamp {
    private readonly tanggal: Date;

    constructor(date: Date) {
      this.tanggal = date;
    }

    toDate() {
      return this.tanggal;
    }

    static fromDate(date: Date) {
      return new Timestamp(date);
    }
  }

  return { Timestamp };
});

describe('requireNonEmpty', () => {
  it('mengembalikan nilai yang sudah di-trim', () => {
    expect(requireNonEmpty('  Lab Komputer A  ', 'Ruangan')).toBe('Lab Komputer A');
  });

  it('menolak nilai kosong dengan nama field', () => {
    expect(() => requireNonEmpty('   ', 'Ruangan')).toThrow('Ruangan wajib diisi.');
  });
});

describe('parseDateInput', () => {
  it('mengubah tanggal valid menjadi ISO WIB', () => {
    expect(parseDateInput(' 2026-11-20 ')).toBe('2026-11-20T00:00:00+07:00');
  });

  it('menolak format selain YYYY-MM-DD', () => {
    expect(() => parseDateInput('20-11-2026')).toThrow(
      'Format tanggal harus YYYY-MM-DD (contoh: 2026-11-20).'
    );
  });

  it('menolak tanggal kalender yang tidak ada', () => {
    expect(() => parseDateInput('2026-02-29')).toThrow('Tanggal kalender tidak valid.');
    expect(() => parseDateInput('2026-13-01')).toThrow('Tanggal kalender tidak valid.');
  });
});

describe('isValidTimeString', () => {
  it('menerima jam 24 jam yang valid', () => {
    expect(isValidTimeString('00:00')).toBe(true);
    expect(isValidTimeString('23:59')).toBe(true);
    expect(isValidTimeString(' 08:00 ')).toBe(true);
  });

  it('menolak jam di luar rentang atau tanpa nol depan', () => {
    expect(isValidTimeString('24:00')).toBe(false);
    expect(isValidTimeString('8:00')).toBe(false);
    expect(isValidTimeString('08:60')).toBe(false);
  });
});

describe('validateTimeRange', () => {
  it('mengembalikan jam mulai dan selesai yang sudah di-trim', () => {
    expect(validateTimeRange(' 08:00 ', ' 10:00 ')).toEqual({
      startTime: '08:00',
      endTime: '10:00',
    });
  });

  it('menolak format jam yang salah', () => {
    expect(() => validateTimeRange('8:00', '10:00')).toThrow(
      'Format jam mulai harus HH:mm (contoh: 08:00).'
    );
    expect(() => validateTimeRange('08:00', '25:00')).toThrow(
      'Format jam selesai harus HH:mm (contoh: 10:00).'
    );
  });

  it('menolak jam selesai yang tidak lebih akhir', () => {
    expect(() => validateTimeRange('10:00', '10:00')).toThrow(
      'Jam selesai harus lebih akhir dari jam mulai.'
    );
    expect(() => validateTimeRange('10:00', '09:59')).toThrow(
      'Jam selesai harus lebih akhir dari jam mulai.'
    );
  });
});

describe('konversi waktu', () => {
  it('mengonversi Date, string, dan Timestamp menjadi Date', () => {
    const date = new Date('2026-11-20T00:00:00.000Z');

    expect(toDate(date)).toBe(date);
    expect(toDate('2026-11-20T00:00:00.000Z').toISOString()).toBe(date.toISOString());
    expect(toDate(Timestamp.fromDate(date)).toISOString()).toBe(date.toISOString());
  });

  it('memakai nilai aman untuk input kosong atau tidak valid', () => {
    expect(Number.isNaN(toDate(null).getTime())).toBe(true);
    expect(toMillis(null)).toBe(0);
    expect(formatShortDate(null)).toBe('-');
    expect(toDateInputValue(null)).toBe('');
  });

  it('mengubah waktu menjadi tanggal input WIB', () => {
    expect(toDateInputValue('2026-11-20T17:30:00.000Z')).toBe('2026-11-21');
  });

  it('mengembalikan Timestamp dan menolak tanggal tidak valid', () => {
    expect(toFirestoreTimestamp(new Date('2026-11-20T00:00:00.000Z'))).toBeInstanceOf(Timestamp);
    expect(() => toFirestoreTimestamp(new Date('bukan tanggal'))).toThrow('Tanggal tidak valid.');
  });
});

describe('rethrowServiceError', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('memetakan galat Firebase ke pesan Indonesia', () => {
    expect(() => rethrowServiceError({ code: 'firestore/permission-denied' })).toThrow(
      'Kamu tidak punya akses untuk tindakan ini.'
    );
  });

  it('mempertahankan Error validasi lokal', () => {
    const localError = new Error('Ruangan wajib diisi.');

    try {
      rethrowServiceError(localError);
      throw new Error('seharusnya melempar');
    } catch (error) {
      expect(error).toBe(localError);
    }
  });

  it('memakai pesan umum untuk nilai yang tidak dikenal', () => {
    expect(() => rethrowServiceError('gagal')).toThrow('Terjadi kesalahan. Coba lagi.');
  });
});
