import {
  formatJamWIB,
  formatRentangWIB,
  formatTanggal,
  formatTanggalPendek,
  sapaanWIB,
  tanggalHariIniWIB,
} from './format';

describe('formatTanggal', () => {
  it('memformat tanggal panjang dalam bahasa Indonesia', () => {
    expect(formatTanggal('2026-11-20')).toBe('Jumat, 20 November 2026');
  });
});

describe('formatTanggalPendek', () => {
  it('memformat tanggal ringkas dengan bulan tiga huruf', () => {
    expect(formatTanggalPendek('2026-11-20')).toBe('20 Nov 2026');
  });
});

describe('formatJamWIB', () => {
  it('mengubah UTC menjadi jam WIB', () => {
    expect(formatJamWIB('2026-11-20T01:05:00.000Z')).toBe('08.05');
  });

  it('menangani pergantian hari WIB', () => {
    expect(formatJamWIB('2026-11-20T17:30:00.000Z')).toBe('00.30');
  });
});

describe('formatRentangWIB', () => {
  it('mengganti titik dua dan tanda hubung', () => {
    expect(formatRentangWIB('08:00 - 10:00')).toBe('08.00–10.00 WIB');
  });
});

describe('sapaanWIB', () => {
  it.each([
    ['2026-11-19T21:00:00.000Z', 'Selamat pagi'],
    ['2026-11-20T03:59:00.000Z', 'Selamat pagi'],
    ['2026-11-20T04:00:00.000Z', 'Selamat siang'],
    ['2026-11-20T07:59:00.000Z', 'Selamat siang'],
    ['2026-11-20T08:00:00.000Z', 'Selamat sore'],
    ['2026-11-20T10:59:00.000Z', 'Selamat sore'],
    ['2026-11-20T11:00:00.000Z', 'Selamat malam'],
    ['2026-11-20T20:59:00.000Z', 'Selamat malam'],
  ])('memakai sapaan yang tepat pada %s', (iso, sapaan) => {
    expect(sapaanWIB(new Date(iso))).toBe(sapaan);
  });
});

describe('tanggalHariIniWIB', () => {
  it('memakai tanggal WIB, bukan tanggal UTC', () => {
    expect(tanggalHariIniWIB(new Date('2026-11-20T18:00:00.000Z'))).toBe('2026-11-21');
  });
});
