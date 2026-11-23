import {
  buatGagal,
  hasilGagalDariGalat,
  pesanGagalPresensi,
  type AttendanceFailureCode,
} from './attendance-errors';

function galatCallable(code: string, details?: unknown) {
  return Object.assign(new Error(code), { code: `functions/${code}`, details });
}

describe('pesanGagalPresensi', () => {
  it('menyebut jarak, nama lab, dan radius saat di luar radius', () => {
    expect(
      pesanGagalPresensi('OUT_OF_RADIUS', { distanceMeters: 139.6, radiusMeters: 100, laboratoryName: 'Lab A201' })
    ).toBe('Kamu berada 140 m dari Lab A201. Radius yang diizinkan 100 m.');
  });

  it('menulis jarak jauh dalam kilometer', () => {
    expect(
      pesanGagalPresensi('OUT_OF_RADIUS', { distanceMeters: 13_751_698, radiusMeters: 500, laboratoryName: 'Dapur Informatika' })
    ).toBe('Kamu berada 13751,7 km dari Dapur Informatika. Radius yang diizinkan 500 m.');
  });

  it('memakai kata laboratorium bila nama lab kosong', () => {
    expect(pesanGagalPresensi('OUT_OF_RADIUS', { distanceMeters: 233, radiusMeters: 100, laboratoryName: '  ' })).toBe(
      'Kamu berada 233 m dari laboratorium. Radius yang diizinkan 100 m.'
    );
  });

  it('tidak menampilkan angka bila jarak atau radius tidak valid', () => {
    expect(pesanGagalPresensi('OUT_OF_RADIUS', { distanceMeters: Number.NaN, radiusMeters: 100 })).toBe(
      'Kamu berada di luar radius laboratorium.'
    );
  });

  it('memakai pesan koneksi dari PRD untuk NETWORK', () => {
    expect(pesanGagalPresensi('NETWORK')).toBe('Koneksi bermasalah. Presensi tidak tercatat. Coba lagi.');
  });

  it('punya pesan untuk setiap kode', () => {
    const semua: AttendanceFailureCode[] = [
      'SESSION_NOT_FOUND',
      'SESSION_NOT_OPEN',
      'NOT_ENROLLED',
      'LAB_NOT_SET',
      'LAB_INACTIVE',
      'OUT_OF_RADIUS',
      'LOCATION_INACCURATE',
      'MOCK_LOCATION',
      'ALREADY_PRESENT',
      'NETWORK',
      'UNKNOWN',
    ];
    for (const kode of semua) {
      const pesan = pesanGagalPresensi(kode);
      expect(pesan.length).toBeGreaterThan(0);
      expect(pesan).not.toContain('—');
    }
  });
});

describe('buatGagal', () => {
  it('hanya menyertakan angka yang valid', () => {
    expect(buatGagal('OUT_OF_RADIUS', { distanceMeters: 140, radiusMeters: -1 })).toEqual({
      ok: false,
      code: 'OUT_OF_RADIUS',
      message: 'Kamu berada di luar radius laboratorium.',
      distanceMeters: 140,
    });
  });
});

describe('hasilGagalDariGalat', () => {
  it('memakai kode domain dari details callable', () => {
    const hasil = hasilGagalDariGalat(
      galatCallable('failed-precondition', { code: 'OUT_OF_RADIUS', distanceMeters: 140, radiusMeters: 100 }),
      'Lab A201'
    );

    expect(hasil).toEqual({
      ok: false,
      code: 'OUT_OF_RADIUS',
      message: 'Kamu berada 140 m dari Lab A201. Radius yang diizinkan 100 m.',
      distanceMeters: 140,
      radiusMeters: 100,
    });
  });

  it('memetakan presensi ganda dari already-exists', () => {
    const hasil = hasilGagalDariGalat(galatCallable('already-exists', { code: 'ALREADY_PRESENT' }));
    expect(hasil.code).toBe('ALREADY_PRESENT');
  });

  it.each(['unavailable', 'deadline-exceeded', 'internal'])('menganggap %s sebagai masalah koneksi', (kode) => {
    expect(hasilGagalDariGalat(galatCallable(kode))).toEqual({
      ok: false,
      code: 'NETWORK',
      message: 'Koneksi bermasalah. Presensi tidak tercatat. Coba lagi.',
    });
  });

  it('meminta login ulang saat unauthenticated', () => {
    expect(hasilGagalDariGalat(galatCallable('unauthenticated'))).toEqual({
      ok: false,
      code: 'UNKNOWN',
      message: 'Sesi login sudah berakhir. Silakan masuk kembali.',
    });
  });

  it('tidak mempercayai kode details yang bukan kode domain', () => {
    expect(hasilGagalDariGalat(galatCallable('failed-precondition', { code: 'NETWORK' })).code).toBe('UNKNOWN');
    expect(hasilGagalDariGalat(galatCallable('failed-precondition', { code: 'HACK' })).code).toBe('UNKNOWN');
  });

  it('aman untuk error yang bukan objek atau details yang rusak', () => {
    expect(hasilGagalDariGalat('putus').code).toBe('UNKNOWN');
    expect(hasilGagalDariGalat(null).code).toBe('UNKNOWN');
    expect(hasilGagalDariGalat(galatCallable('failed-precondition', 'bukan objek')).code).toBe('UNKNOWN');
  });
});
