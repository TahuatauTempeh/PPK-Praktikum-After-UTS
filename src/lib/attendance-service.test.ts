import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { logAction } from '@/lib/firebase/audit';
import type { UserProfile } from '@/types';

import { listenMyAttendance, submitAttendance, submitAttendanceWithLocation } from './attendance-service';

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

jest.mock('@/lib/firebase/app', () => ({
  getFirebaseApp: jest.fn(() => 'APP'),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getDb: jest.fn(() => ({})),
  COLLECTIONS: { sessions: 'sessions', attendance: 'attendance' },
}));

jest.mock('@/lib/firebase/audit', () => ({
  logAction: jest.fn(),
}));

const getDocMock = jest.mocked(getDoc);
const setDocMock = jest.mocked(setDoc);
const logActionMock = jest.mocked(logAction);

const profile = {
  id: 'u1',
  name: 'Bunga Maharani',
  nim: '231110002',
  email: 'bunga@example.com',
  role: 'praktikan',
  isAdmin: false,
  createdAt: null,
  updatedAt: null,
} as UserProfile;

function sessionSnapshot(status: string): DocumentSnapshot<DocumentData> {
  return {
    exists: () => true,
    id: 's1',
    data: () => ({ status }),
  } as unknown as DocumentSnapshot<DocumentData>;
}

function attendanceSnapshot(exists: boolean): DocumentSnapshot<DocumentData> {
  return { exists: () => exists } as unknown as DocumentSnapshot<DocumentData>;
}

const missingSnapshot = {
  exists: () => false,
} as unknown as DocumentSnapshot<DocumentData>;

describe('submitAttendance', () => {
  it('menolak sesi yang tidak ditemukan', async () => {
    getDocMock.mockResolvedValueOnce(missingSnapshot);

    await expect(submitAttendance('s1', profile)).resolves.toEqual({
      success: false,
      message: 'Sesi tidak ditemukan.',
    });
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('menolak presensi saat sesi belum dibuka', async () => {
    getDocMock.mockResolvedValueOnce(sessionSnapshot('scheduled'));

    await expect(submitAttendance('s1', profile)).resolves.toEqual({
      success: false,
      message: 'Sesi belum dibuka oleh asisten.',
    });
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('menolak presensi saat sesi sudah ditutup', async () => {
    getDocMock.mockResolvedValueOnce(sessionSnapshot('closed'));

    await expect(submitAttendance('s1', profile)).resolves.toEqual({
      success: false,
      message: 'Sesi sudah ditutup, presensi tidak bisa dilakukan.',
    });
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('menolak presensi ganda', async () => {
    getDocMock
      .mockResolvedValueOnce(sessionSnapshot('open'))
      .mockResolvedValueOnce(attendanceSnapshot(true));

    await expect(submitAttendance('s1', profile)).resolves.toEqual({
      success: false,
      message: 'Kamu sudah melakukan presensi di sesi ini.',
    });
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('menyimpan presensi dengan ID sesi dan uid serta menulis audit log', async () => {
    getDocMock
      .mockResolvedValueOnce(sessionSnapshot('open'))
      .mockResolvedValueOnce(attendanceSnapshot(false));
    setDocMock.mockResolvedValueOnce(undefined);

    await expect(submitAttendance('s1', profile)).resolves.toEqual({
      success: true,
      message: 'Presensi berhasil dicatat.',
    });
    expect(setDocMock).toHaveBeenCalledWith(
      { collectionName: 'attendance', id: 's1_u1' },
      {
        sessionId: 's1',
        userId: 'u1',
        userName: 'Bunga Maharani',
        userNim: '231110002',
        recordedAt: 'SERVER_TS',
      }
    );
    expect(logActionMock).toHaveBeenCalledWith(
      'SUBMIT_ATTENDANCE',
      'attendance',
      's1_u1',
      null,
      expect.objectContaining({ sessionId: 's1', userId: 'u1' })
    );
  });

  it('mengubah penolakan dokumen ganda dari Firestore menjadi pesan presensi ganda', async () => {
    getDocMock
      .mockResolvedValueOnce(sessionSnapshot('open'))
      .mockResolvedValueOnce(attendanceSnapshot(false));
    setDocMock.mockRejectedValueOnce(new Error('Document already exists'));

    await expect(submitAttendance('s1', profile)).resolves.toEqual({
      success: false,
      message: 'Kamu sudah melakukan presensi di sesi ini.',
    });
  });

  it('mengembalikan pesan aman saat penyimpanan gagal', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocMock
      .mockResolvedValueOnce(sessionSnapshot('open'))
      .mockResolvedValueOnce(attendanceSnapshot(false));
    setDocMock.mockRejectedValueOnce(new Error('network down'));

    await expect(submitAttendance('s1', profile)).resolves.toEqual({
      success: false,
      message: 'Gagal mencatat presensi. Coba lagi.',
    });
  });
});

describe('submitAttendanceWithLocation', () => {
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

    await expect(submitAttendanceWithLocation('s1', posisi)).resolves.toEqual({
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

    await expect(submitAttendanceWithLocation('s1', posisi, 'Lab A201')).resolves.toEqual({
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

    await expect(submitAttendanceWithLocation('s1', posisi)).resolves.toMatchObject({
      ok: false,
      code: 'NETWORK',
      message: 'Koneksi bermasalah. Presensi tidak tercatat. Coba lagi.',
    });
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
