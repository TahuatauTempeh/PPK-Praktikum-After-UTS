import { onSnapshot, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { submitAttendanceViaTransaction } from '@/lib/attendance-fallback';

import {
  JALUR_PRESENSI,
  listenMyAttendance,
  submitAttendanceViaCallable,
  submitAttendanceWithLocation,
} from './attendance-service';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db: unknown, collectionName: string, id: string) => ({ collectionName, id })),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
  onSnapshot: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => 'FUNCTIONS'),
  httpsCallable: jest.fn(),
}));

jest.mock('@/lib/attendance-fallback', () => ({
  submitAttendanceViaTransaction: jest.fn(),
}));

jest.mock('@/lib/firebase/app', () => ({
  getFirebaseApp: jest.fn(() => 'APP'),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getDb: jest.fn(() => ({})),
  COLLECTIONS: { sessions: 'sessions', attendance: 'attendance' },
}));

const setDocMock = jest.mocked(setDoc);

describe('submitAttendanceViaCallable', () => {
  const httpsCallableMock = jest.mocked(httpsCallable);
  const posisi = { latitude: -7.0519, longitude: 110.4383, accuracyMeters: 12, mocked: false, timestamp: 1 };

  function callable(impl: () => Promise<unknown>) {
    const fn = jest.fn(impl);
    httpsCallableMock.mockReturnValueOnce(fn as unknown as ReturnType<typeof httpsCallable>);
    return fn;
  }

  it('memanggil callable di region asia-southeast2 dengan koordinat perangkat', async () => {
    const fn = callable(async () => ({
      data: {
        attendanceId: 's1_u1',
        recordedAt: '2026-11-23T01:07:00.000Z',
        distanceMeters: 23,
        radiusMeters: 100,
        laboratoryId: 'lab-a',
        laboratoryName: 'Lab A201',
      },
    }));

    await expect(submitAttendanceViaCallable('s1', posisi)).resolves.toEqual({
      ok: true,
      recordedAt: '2026-11-23T01:07:00.000Z',
      distanceMeters: 23,
      radiusMeters: 100,
    });
    expect(jest.mocked(getFunctions)).toHaveBeenCalledWith('APP', 'asia-southeast2');
    expect(httpsCallableMock).toHaveBeenCalledWith('FUNCTIONS', 'submitAttendance');
    expect(fn).toHaveBeenCalledWith({
      sessionId: 's1',
      latitude: -7.0519,
      longitude: 110.4383,
      accuracyMeters: 12,
      mocked: false,
    });
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('mengembalikan penolakan server dengan jarak dan nama lab', async () => {
    callable(async () => {
      throw Object.assign(new Error('luar radius'), {
        code: 'functions/failed-precondition',
        details: { code: 'OUT_OF_RADIUS', distanceMeters: 140, radiusMeters: 100 },
      });
    });

    await expect(submitAttendanceViaCallable('s1', posisi, 'Lab A201')).resolves.toEqual({
      ok: false,
      code: 'OUT_OF_RADIUS',
      message: 'Kamu berada 140 m dari Lab A201. Radius yang diizinkan 100 m.',
      distanceMeters: 140,
      radiusMeters: 100,
    });
  });

  it('melaporkan masalah koneksi tanpa status sukses', async () => {
    callable(async () => {
      throw Object.assign(new Error('internal'), { code: 'functions/internal' });
    });

    await expect(submitAttendanceViaCallable('s1', posisi)).resolves.toMatchObject({
      ok: false,
      code: 'NETWORK',
      message: 'Koneksi bermasalah. Presensi tidak tercatat. Coba lagi.',
    });
  });
});

describe('submitAttendanceWithLocation', () => {
  it('memakai fallback transaksi selama project masih Spark', async () => {
    const posisi = { latitude: -7.0519, longitude: 110.4383, accuracyMeters: 12, mocked: false, timestamp: 1 };
    const profil = { id: 'u1', name: 'Bunga', nim: '24060123' };
    const hasil = { ok: true as const, recordedAt: '2026-11-23T01:07:00.000Z', distanceMeters: 0, radiusMeters: 100 };
    jest.mocked(submitAttendanceViaTransaction).mockResolvedValueOnce(hasil);

    expect(JALUR_PRESENSI).toBe('fallback');
    await expect(submitAttendanceWithLocation('s1', posisi, profil, 'Lab A201')).resolves.toEqual(hasil);
    expect(submitAttendanceViaTransaction).toHaveBeenCalledWith('s1', posisi, profil, 'Lab A201');
    expect(httpsCallable).not.toHaveBeenCalled();
  });
});

describe('listenMyAttendance', () => {
  it('meneruskan pesan galat listener yang sudah dipetakan', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onError = jest.fn();
    jest.mocked(onSnapshot).mockImplementationOnce(((_ref: unknown, _next: unknown, error: (e: unknown) => void) => {
      error({ code: 'permission-denied' });
      return () => {};
    }) as unknown as typeof onSnapshot);

    listenMyAttendance('s1', 'u1', jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith('Kamu tidak punya akses untuk tindakan ini.');
  });
});
