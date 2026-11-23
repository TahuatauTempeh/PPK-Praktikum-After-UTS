import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { bacaInput, handleSubmitAttendance } from './attendance';

type Data = Record<string, unknown>;
interface Ref {
  collection: string;
  id: string;
}

/** Firestore palsu: cukup untuk runTransaction, get, dan create */
class FakeDb {
  readonly store = new Map<string, Map<string, Data>>();
  readonly writes: { collection: string; id: string; data: Data }[] = [];
  createError: unknown = null;
  private autoId = 0;

  constructor(seed: Record<string, Record<string, Data>>) {
    for (const [collection, docs] of Object.entries(seed)) {
      this.store.set(collection, new Map(Object.entries(docs)));
    }
  }

  collection(name: string) {
    return {
      doc: (id?: string): Ref => ({ collection: name, id: id ?? `auto-${++this.autoId}` }),
    };
  }

  async runTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    const pending: { collection: string; id: string; data: Data }[] = [];
    const tx = {
      get: async (ref: Ref) => {
        const data = this.store.get(ref.collection)?.get(ref.id);
        return { exists: data !== undefined, id: ref.id, data: () => data };
      },
      create: (ref: Ref, data: Data) => {
        pending.push({ collection: ref.collection, id: ref.id, data });
      },
    };
    const hasil = await fn(tx);
    if (this.createError) throw this.createError;
    this.writes.push(...pending);
    return hasil;
  }

  asFirestore(): Firestore {
    return this as unknown as Firestore;
  }
}

const UID = 'u1';
const LAB_A = { latitude: -7.0519, longitude: 110.4383 };
const NOW = new Date('2026-11-23T01:07:00.000Z');

function seed(ubah: Partial<Record<string, Record<string, Data>>> = {}) {
  return {
    users: { [UID]: { role: 'praktikan', name: 'Bunga Maharani', nim: '24060123' } },
    sessions: { s1: { status: 'open', classId: 'c1', laboratoryId: 'lab-a' } },
    enrollments: { [`c1_${UID}`]: { classId: 'c1', userId: UID } },
    laboratories: { 'lab-a': { name: 'Lab A201', isActive: true, radiusMeters: 100, ...LAB_A } },
    attendance: {},
    ...ubah,
  };
}

const INPUT = { sessionId: 's1', latitude: LAB_A.latitude, longitude: LAB_A.longitude, accuracyMeters: 12 };

async function galat(promise: Promise<unknown>): Promise<HttpsError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof HttpsError) return error;
    throw error;
  }
  throw new Error('diharapkan gagal');
}

async function tolakan(db: FakeDb, data: unknown = INPUT) {
  const error = await galat(handleSubmitAttendance(db.asFirestore(), UID, data, NOW));
  return { http: error.code, code: (error.details as { code?: string } | undefined)?.code, error };
}

describe('handleSubmitAttendance', () => {
  it('mencatat presensi dengan bukti lokasi dan audit log dalam satu transaksi', async () => {
    const db = new FakeDb(seed());

    const hasil = await handleSubmitAttendance(db.asFirestore(), UID, INPUT, NOW);

    expect(hasil).toEqual({
      attendanceId: `s1_${UID}`,
      recordedAt: '2026-11-23T01:07:00.000Z',
      distanceMeters: 0,
      radiusMeters: 100,
      laboratoryId: 'lab-a',
      laboratoryName: 'Lab A201',
    });
    expect(db.writes.map((w) => w.collection)).toEqual(['attendance', 'auditLogs']);

    const presensi = db.writes[0];
    expect(presensi.id).toBe(`s1_${UID}`);
    expect(presensi.data).toMatchObject({
      sessionId: 's1',
      userId: UID,
      userName: 'Bunga Maharani',
      userNim: '24060123',
      latitude: LAB_A.latitude,
      longitude: LAB_A.longitude,
      accuracyMeters: 12,
      distanceMeters: 0,
      radiusMeters: 100,
      laboratoryId: 'lab-a',
      mocked: false,
      source: 'location',
    });
    expect((presensi.data.recordedAt as { toDate(): Date }).toDate()).toEqual(NOW);
    expect(db.writes[1].data).toMatchObject({
      action: 'SUBMIT_ATTENDANCE',
      collection: 'attendance',
      docId: `s1_${UID}`,
      actorUid: UID,
      actorRole: 'praktikan',
      before: null,
    });
  });

  it('menolak permintaan tanpa login', async () => {
    const error = await galat(handleSubmitAttendance(new FakeDb(seed()).asFirestore(), undefined, INPUT, NOW));
    expect(error.code).toBe('unauthenticated');
  });

  it('menolak pengguna yang bukan praktikan', async () => {
    const db = new FakeDb(seed({ users: { [UID]: { role: 'asisten' } } }));
    expect((await tolakan(db)).http).toBe('permission-denied');
    expect(db.writes).toHaveLength(0);
  });

  it.each<[string, Partial<Record<string, Record<string, Data>>>, string, string]>([
    ['sesi tidak ada', { sessions: {} }, 'not-found', 'SESSION_NOT_FOUND'],
    ['sesi belum dibuka', { sessions: { s1: { status: 'scheduled', classId: 'c1', laboratoryId: 'lab-a' } } }, 'failed-precondition', 'SESSION_NOT_OPEN'],
    ['sesi sudah ditutup', { sessions: { s1: { status: 'closed', classId: 'c1', laboratoryId: 'lab-a' } } }, 'failed-precondition', 'SESSION_NOT_OPEN'],
    ['bukan peserta kelas', { enrollments: {} }, 'permission-denied', 'NOT_ENROLLED'],
    ['sesi tanpa lab', { sessions: { s1: { status: 'open', classId: 'c1', laboratoryId: '' } } }, 'failed-precondition', 'LAB_NOT_SET'],
    ['dokumen lab hilang', { laboratories: {} }, 'failed-precondition', 'LAB_NOT_SET'],
    [
      'lab nonaktif',
      { laboratories: { 'lab-a': { name: 'Lab A201', isActive: false, radiusMeters: 100, ...LAB_A } } },
      'failed-precondition',
      'LAB_INACTIVE',
    ],
    ['sudah presensi', { attendance: { [`s1_${UID}`]: { sessionId: 's1', userId: UID } } }, 'already-exists', 'ALREADY_PRESENT'],
  ])('menolak %s tanpa menulis apa pun', async (_, ubah, http, code) => {
    const db = new FakeDb(seed(ubah));
    expect(await tolakan(db)).toMatchObject({ http, code });
    expect(db.writes).toHaveLength(0);
  });

  it('menolak di luar radius dan mengirim jarak serta radius', async () => {
    const db = new FakeDb(seed());
    const { http, code, error } = await tolakan(db, { ...INPUT, latitude: -7.054 });

    expect({ http, code }).toEqual({ http: 'failed-precondition', code: 'OUT_OF_RADIUS' });
    const detail = error.details as { distanceMeters: number; radiusMeters: number };
    expect(Math.round(detail.distanceMeters)).toBeGreaterThanOrEqual(232);
    expect(Math.round(detail.distanceMeters)).toBeLessThanOrEqual(234);
    expect(detail.radiusMeters).toBe(100);
    expect(db.writes).toHaveLength(0);
  });

  it('menolak akurasi lebih dari 100 m dan lokasi palsu', async () => {
    expect((await tolakan(new FakeDb(seed()), { ...INPUT, accuracyMeters: 150 })).code).toBe('LOCATION_INACCURATE');
    expect((await tolakan(new FakeDb(seed()), { ...INPUT, mocked: true })).code).toBe('MOCK_LOCATION');
  });

  it('menganggap tabrakan create sebagai presensi ganda', async () => {
    const db = new FakeDb(seed());
    db.createError = Object.assign(new Error('ALREADY_EXISTS'), { code: 6 });
    expect(await tolakan(db)).toMatchObject({ http: 'already-exists', code: 'ALREADY_PRESENT' });
  });

  it('menyembunyikan detail error internal', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const db = new FakeDb(seed());
    db.createError = new Error('koneksi Firestore putus: host 10.0.0.1');
    const { http, error } = await tolakan(db);
    expect(http).toBe('internal');
    expect(error.message).toBe('Terjadi kesalahan.');
  });
});

describe('bacaInput', () => {
  it.each<[string, unknown]>([
    ['bukan objek', 'x'],
    ['sessionId kosong', { ...INPUT, sessionId: '  ' }],
    ['sessionId berisi garis miring', { ...INPUT, sessionId: 'a/b' }],
    ['latitude di luar rentang', { ...INPUT, latitude: 91 }],
    ['longitude bukan angka', { ...INPUT, longitude: '110' }],
    ['akurasi negatif', { ...INPUT, accuracyMeters: -1 }],
    ['mocked bukan boolean', { ...INPUT, mocked: 'ya' }],
  ])('menolak %s', (_, data) => {
    expect(() => bacaInput(data)).toThrow(HttpsError);
  });

  it('mengisi mocked false bila tidak dikirim', () => {
    expect(bacaInput(INPUT).mocked).toBe(false);
  });
});
