import {
  kelayakanPresensi,
  validasiPresensi,
  type InputKelayakan,
  type InputValidasi,
  type KondisiLokasi,
  type LabPresensi,
} from './attendance-rules';

const LAB: LabPresensi = { isActive: true, latitude: -7.0489, longitude: 110.4381, radiusMeters: 100 };
const POSISI_BAIK = { accuracyMeters: 12, mocked: false };

function validasi(ubah: Partial<InputValidasi> = {}): InputValidasi {
  return {
    sesi: { status: 'open' },
    terdaftar: true,
    lab: LAB,
    sudahPresensi: false,
    posisi: POSISI_BAIK,
    distanceMeters: 23,
    ...ubah,
  };
}

describe('validasiPresensi: tabel keputusan PRD 11.2', () => {
  it.each<[string, Partial<InputValidasi>, string]>([
    ['sesi scheduled', { sesi: { status: 'scheduled' } }, 'SESSION_NOT_OPEN'],
    ['bukan peserta', { terdaftar: false }, 'NOT_ENROLLED'],
    ['sudah presensi', { sudahPresensi: true }, 'ALREADY_PRESENT'],
    ['akurasi buruk', { posisi: { accuracyMeters: 150, mocked: false } }, 'LOCATION_INACCURATE'],
    ['di luar radius', { distanceMeters: 233 }, 'OUT_OF_RADIUS'],
    ['sesi closed', { sesi: { status: 'closed' } }, 'SESSION_NOT_OPEN'],
  ])('menolak %s', (_, ubah, kode) => {
    const hasil = validasiPresensi(validasi(ubah));
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.code).toBe(kode);
  });

  it('menerima bila semua syarat terpenuhi', () => {
    expect(validasiPresensi(validasi())).toEqual({ ok: true, distanceMeters: 23, radiusMeters: 100 });
  });
});

describe('validasiPresensi: syarat tambahan PRD 7.2', () => {
  it('menolak sesi yang tidak ada', () => {
    expect(validasiPresensi(validasi({ sesi: null }))).toEqual({ ok: false, code: 'SESSION_NOT_FOUND' });
  });

  it('menolak sesi tanpa lab atau lab dengan koordinat dan radius tidak sah', () => {
    expect(validasiPresensi(validasi({ lab: null }))).toEqual({ ok: false, code: 'LAB_NOT_SET' });
    expect(validasiPresensi(validasi({ lab: { ...LAB, latitude: 91 } }))).toEqual({ ok: false, code: 'LAB_NOT_SET' });
    expect(validasiPresensi(validasi({ lab: { ...LAB, radiusMeters: 5 } }))).toEqual({ ok: false, code: 'LAB_NOT_SET' });
  });

  it('menolak lab nonaktif', () => {
    expect(validasiPresensi(validasi({ lab: { ...LAB, isActive: false } }))).toEqual({ ok: false, code: 'LAB_INACTIVE' });
  });

  it('menolak lokasi palsu meskipun dalam radius', () => {
    expect(validasiPresensi(validasi({ posisi: { accuracyMeters: 5, mocked: true } }))).toEqual({
      ok: false,
      code: 'MOCK_LOCATION',
    });
  });

  it('menyertakan jarak dan radius saat di luar radius', () => {
    expect(validasiPresensi(validasi({ distanceMeters: 140 }))).toEqual({
      ok: false,
      code: 'OUT_OF_RADIUS',
      distanceMeters: 140,
      radiusMeters: 100,
    });
  });

  it('menerima tepat di batas radius dan batas akurasi', () => {
    const hasil = validasiPresensi(validasi({ distanceMeters: 100, posisi: { accuracyMeters: 100, mocked: false } }));
    expect(hasil.ok).toBe(true);
  });

  it('menolak jarak atau akurasi yang bukan angka', () => {
    expect(validasiPresensi(validasi({ distanceMeters: Number.NaN }))).toMatchObject({ ok: false, code: 'OUT_OF_RADIUS' });
    expect(
      validasiPresensi(validasi({ posisi: { accuracyMeters: Number.POSITIVE_INFINITY, mocked: false } }))
    ).toMatchObject({ ok: false, code: 'LOCATION_INACCURATE' });
  });
});

const SIAP: KondisiLokasi = { tahap: 'siap', posisi: POSISI_BAIK, distanceMeters: 23 };

function kelayakan(ubah: Partial<InputKelayakan> = {}) {
  return kelayakanPresensi({
    sesi: { status: 'open' },
    terdaftar: true,
    lab: LAB,
    jamPresensi: null,
    lokasi: SIAP,
    ...ubah,
  });
}

describe('kelayakanPresensi: tabel tombol PRD 7.1', () => {
  it.each<[string, Partial<InputKelayakan>, string, string]>([
    ['sesi scheduled', { sesi: { status: 'scheduled' } }, 'session-scheduled', 'Sesi belum dibuka'],
    ['sesi closed', { sesi: { status: 'closed' } }, 'session-closed', 'Sesi sudah ditutup'],
    ['sudah presensi', { jamPresensi: '08.07' }, 'already-present', 'Sudah presensi pukul 08.07 WIB'],
    ['bukan peserta', { terdaftar: false }, 'not-enrolled', 'Kamu tidak terdaftar di sesi ini'],
    ['lab belum diatur', { lab: null }, 'lab-missing', 'Laboratorium sesi belum diatur'],
    [
      'izin ditolak',
      { lokasi: { tahap: 'izin', izin: 'denied' } },
      'permission-denied',
      'Izin lokasi diperlukan untuk presensi',
    ],
    ['layanan mati', { lokasi: { tahap: 'layanan-mati' } }, 'services-disabled', 'Aktifkan layanan lokasi'],
    [
      'lokasi belum tersedia',
      { lokasi: { tahap: 'tidak-tersedia' } },
      'location-unavailable',
      'Lokasi belum tersedia, coba lagi',
    ],
    [
      'akurasi rendah',
      { lokasi: { tahap: 'siap', posisi: { accuracyMeters: 180, mocked: false }, distanceMeters: 20 } },
      'low-accuracy',
      'Akurasi lokasi terlalu rendah',
    ],
    [
      'di luar radius',
      { lokasi: { tahap: 'siap', posisi: POSISI_BAIK, distanceMeters: 139.6 } },
      'out-of-radius',
      'Kamu berada 140 m dari lab, radius 100 m',
    ],
  ])('menonaktifkan tombol saat %s', (_, ubah, state, alasan) => {
    const hasil = kelayakan(ubah);
    expect(hasil.tombolAktif).toBe(false);
    expect(hasil.state).toBe(state);
    expect(hasil.alasan).toBe(alasan);
  });

  it('mengaktifkan tombol bila semua syarat terpenuhi', () => {
    expect(kelayakan()).toEqual({
      state: 'eligible',
      tombolAktif: true,
      alasan: 'Presensi sekarang',
      aksi: 'periksa-lagi',
    });
  });
});

describe('kelayakanPresensi: state tambahan SRS 7.2', () => {
  it('menunggu data sebelum menilai lokasi', () => {
    expect(kelayakan({ sesi: undefined }).state).toBe('loading');
    expect(kelayakan({ terdaftar: undefined }).state).toBe('loading');
    expect(kelayakan({ lab: undefined }).state).toBe('loading');
  });

  it('melaporkan sesi yang tidak ditemukan', () => {
    expect(kelayakan({ sesi: null }).state).toBe('session-not-found');
  });

  it('menampilkan presensi lama meskipun sesi sudah ditutup', () => {
    expect(kelayakan({ sesi: { status: 'closed' }, jamPresensi: '08.07' }).state).toBe('already-present');
  });

  it('membedakan izin belum diminta, ditolak, dan diblokir beserta aksinya', () => {
    expect(kelayakan({ lokasi: { tahap: 'izin', izin: 'undetermined' } })).toMatchObject({
      state: 'permission-needed',
      aksi: 'izinkan',
    });
    expect(kelayakan({ lokasi: { tahap: 'izin', izin: 'denied' } }).aksi).toBe('izinkan-lagi');
    expect(kelayakan({ lokasi: { tahap: 'izin', izin: 'blocked' } })).toMatchObject({
      state: 'permission-blocked',
      alasan: 'Izin lokasi diblokir',
      aksi: 'buka-pengaturan',
    });
  });

  it('memberi aksi pengaturan lokasi saat layanan mati', () => {
    expect(kelayakan({ lokasi: { tahap: 'layanan-mati' } }).aksi).toBe('buka-pengaturan-lokasi');
  });

  it('menunjukkan proses saat memeriksa izin dan mencari lokasi', () => {
    expect(kelayakan({ lokasi: { tahap: 'memeriksa-izin' } }).state).toBe('checking-permission');
    expect(kelayakan({ lokasi: { tahap: 'mencari' } })).toMatchObject({ state: 'locating', aksi: null });
  });

  it('menolak lab nonaktif dan lokasi palsu', () => {
    expect(kelayakan({ lab: { ...LAB, isActive: false } }).alasan).toBe('Laboratorium sedang tidak aktif');
    expect(kelayakan({ lokasi: { tahap: 'siap', posisi: { accuracyMeters: 5, mocked: true }, distanceMeters: 3 } }).state).toBe(
      'mock-location'
    );
  });

  it('menulis jarak jauh dalam kilometer', () => {
    expect(kelayakan({ lokasi: { tahap: 'siap', posisi: POSISI_BAIK, distanceMeters: 13_751_698 } }).alasan).toBe(
      'Kamu berada 13751,7 km dari lab, radius 100 m'
    );
  });

  it('mengaktifkan tombol tepat di batas radius', () => {
    expect(kelayakan({ lokasi: { tahap: 'siap', posisi: POSISI_BAIK, distanceMeters: 100 } }).tombolAktif).toBe(true);
  });

  it('tidak memakai em dash di teks alasan', () => {
    const contoh = [
      kelayakan(),
      kelayakan({ sesi: { status: 'closed' } }),
      kelayakan({ lokasi: { tahap: 'izin', izin: 'blocked' } }),
      kelayakan({ lokasi: { tahap: 'siap', posisi: POSISI_BAIK, distanceMeters: 300 } }),
    ];
    for (const item of contoh) expect(item.alasan).not.toContain('—');
  });
});
