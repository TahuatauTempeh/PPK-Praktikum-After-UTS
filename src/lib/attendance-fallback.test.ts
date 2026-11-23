import { getDoc, runTransaction } from 'firebase/firestore';

import { getEnrollmentsByUser } from '@/lib/enrollment-service';

import { submitAttendanceViaTransaction } from './attendance-fallback';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db: unknown, name: string) => ({ name })),
  doc: jest.fn((first: unknown, name?: string, id?: string) =>
    name ? { path: `${name}/${id}` } : { path: `${(first as { name: string }).name}/auto` }
  ),
  getDoc: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
}));
jest.mock('@/lib/firebase/firestore', () => ({
  getDb: jest.fn(() => ({})),
  COLLECTIONS: {
    attendance: 'attendance',
    auditLogs: 'auditLogs',
    laboratories: 'laboratories',
    sessions: 'sessions',
  },
}));
jest.mock('@/lib/enrollment-service', () => ({ getEnrollmentsByUser: jest.fn() }));

type Data = Record<string, unknown>;

const LAB_A = { latitude: -7.0519, longitude: 110.4383 };
const PROFIL = { id: 'u1', name: 'Bunga Maharani', nim: '24060123' };
const POSISI = { ...LAB_A, accuracyMeters: 12, mocked: false, timestamp: 1 };

let db: Record<string, Data | undefined>;
let ditulis: { path: string; data: Data }[];

function siapkan(ubah: Record<string, Data | undefined> = {}) {
  db = {
    'sessions/s1': { status: 'open', classId: 'c1', laboratoryId: 'lab-a' },
    'laboratories/lab-a': { name: 'Lab A201', isActive: true, radiusMeters: 100, ...LAB_A },
    ...ubah,
  };
  ditulis = [];
  jest.mocked(runTransaction).mockImplementation((async (_db: unknown, fn: (tx: unknown) => Promise<unknown>) => {
    const pending: { path: string; data: Data }[] = [];
    const tx = {
      get: async (ref: { path: string }) => ({ exists: () => db[ref.path] !== undefined, data: () => db[ref.path] }),
      set: (ref: { path: string }, data: Data) => pending.push({ path: ref.path, data }),
    };
    const hasil = await fn(tx);
    ditulis.push(...pending);
    return hasil;
  }) as unknown as typeof runTransaction);
  jest.mocked(getDoc).mockResolvedValue({
    data: () => ({ recordedAt: { toDate: () => new Date('2026-11-23T01:07:00.000Z') } }),
  } as never);
}

beforeEach(() => {
  jest.mocked(getEnrollmentsByUser).mockResolvedValue([
    { id: 'c1_u1', classId: 'c1', userId: 'u1', userName: 'Bunga', enrolledAt: '' },
  ]);
});

describe('submitAttendanceViaTransaction', () => {
  it('mencatat presensi dengan bukti lokasi dan audit log dalam satu transaksi', async () => {
    siapkan();

    await expect(submitAttendanceViaTransaction('s1', POSISI, PROFIL, 'Lab A201')).resolves.toEqual({
      ok: true,
      recordedAt: '2026-11-23T01:07:00.000Z',
      distanceMeters: 0,
      radiusMeters: 100,
    });

    expect(ditulis.map((w) => w.path)).toEqual(['attendance/s1_u1', 'auditLogs/auto']);
    expect(ditulis[0].data).toEqual({
      sessionId: 's1',
      userId: 'u1',
      userName: 'Bunga Maharani',
      userNim: '24060123',
      recordedAt: 'SERVER_TS',
      latitude: LAB_A.latitude,
      longitude: LAB_A.longitude,
      accuracyMeters: 12,
      distanceMeters: 0,
      radiusMeters: 100,
      laboratoryId: 'lab-a',
      locationVerifiedAt: 'SERVER_TS',
      mocked: false,
      source: 'location',
    });
    expect(ditulis[1].data).toMatchObject({
      action: 'SUBMIT_ATTENDANCE',
      docId: 's1_u1',
      actorUid: 'u1',
      actorRole: 'praktikan',
      timestamp: 'SERVER_TS',
    });
  });

  it.each<[string, Record<string, Data | undefined>, string]>([
    ['sesi tidak ada', { 'sessions/s1': undefined }, 'SESSION_NOT_FOUND'],
    ['sesi ditutup', { 'sessions/s1': { status: 'closed', classId: 'c1', laboratoryId: 'lab-a' } }, 'SESSION_NOT_OPEN'],
    ['sesi tanpa lab', { 'sessions/s1': { status: 'open', classId: 'c1', laboratoryId: '' } }, 'LAB_NOT_SET'],
    [
      'lab nonaktif',
      { 'laboratories/lab-a': { name: 'Lab A201', isActive: false, radiusMeters: 100, ...LAB_A } },
      'LAB_INACTIVE',
    ],
    ['sudah presensi', { 'attendance/s1_u1': { userId: 'u1' } }, 'ALREADY_PRESENT'],
  ])('menolak %s tanpa menulis apa pun', async (_, ubah, code) => {
    siapkan(ubah);
    await expect(submitAttendanceViaTransaction('s1', POSISI, PROFIL)).resolves.toMatchObject({ ok: false, code });
    expect(ditulis).toHaveLength(0);
  });

  it('menolak praktikan yang tidak terdaftar di kelas sesi', async () => {
    siapkan();
    jest.mocked(getEnrollmentsByUser).mockResolvedValue([]);

    await expect(submitAttendanceViaTransaction('s1', POSISI, PROFIL)).resolves.toMatchObject({
      ok: false,
      code: 'NOT_ENROLLED',
      message: 'Kamu tidak terdaftar di sesi ini.',
    });
    expect(ditulis).toHaveLength(0);
  });

  it('menolak di luar radius dengan pesan jarak', async () => {
    siapkan();
    const hasil = await submitAttendanceViaTransaction('s1', { ...POSISI, latitude: -7.054 }, PROFIL, 'Lab A201');

    expect(hasil).toMatchObject({ ok: false, code: 'OUT_OF_RADIUS', radiusMeters: 100 });
    expect(hasil.ok ? '' : hasil.message).toMatch(/^Kamu berada 23[2-4] m dari Lab A201\. Radius yang diizinkan 100 m\.$/);
    expect(ditulis).toHaveLength(0);
  });

  it('menolak akurasi rendah dan lokasi palsu', async () => {
    siapkan();
    await expect(
      submitAttendanceViaTransaction('s1', { ...POSISI, accuracyMeters: 150 }, PROFIL)
    ).resolves.toMatchObject({ code: 'LOCATION_INACCURATE' });
    await expect(submitAttendanceViaTransaction('s1', { ...POSISI, mocked: true }, PROFIL)).resolves.toMatchObject({
      code: 'MOCK_LOCATION',
    });
  });

  it('melaporkan masalah koneksi bila transaksi gagal', async () => {
    siapkan();
    jest.mocked(runTransaction).mockRejectedValueOnce({ code: 'unavailable' });

    await expect(submitAttendanceViaTransaction('s1', POSISI, PROFIL)).resolves.toEqual({
      ok: false,
      code: 'NETWORK',
      message: 'Koneksi bermasalah. Presensi tidak tercatat. Coba lagi.',
    });
  });

  it('menjelaskan penolakan rules tanpa menampilkan kode mentah', async () => {
    siapkan();
    jest.mocked(runTransaction).mockRejectedValueOnce({ code: 'permission-denied' });

    await expect(submitAttendanceViaTransaction('s1', POSISI, PROFIL)).resolves.toEqual({
      ok: false,
      code: 'UNKNOWN',
      message: 'Presensi ditolak server. Pastikan sesi masih dibuka, lalu periksa lokasi dan coba lagi.',
    });
  });

  it('tetap sukses memakai jam perangkat bila jam server gagal dibaca ulang', async () => {
    siapkan();
    jest.mocked(getDoc).mockRejectedValueOnce(new Error('offline'));

    const hasil = await submitAttendanceViaTransaction('s1', POSISI, PROFIL);
    expect(hasil.ok).toBe(true);
    expect(ditulis).toHaveLength(2);
  });
});
