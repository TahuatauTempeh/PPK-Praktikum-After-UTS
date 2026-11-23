import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { collection, getDoc, onSnapshot, query, setDoc, where } from 'firebase/firestore';

import { logAction } from '@/lib/firebase/audit';
import type { UserProfile } from '@/types';

import {
  listenAllAttendance,
  listenUserAttendance,
  submitAttendance,
  toAttendanceRecord,
  toAttendanceRecordsForUser,
  type AttendanceDoc,
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
  Timestamp: class Timestamp {},
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

describe('pemetaan attendance', () => {
  const base: AttendanceDoc = {
    id: 's1_u1',
    sessionId: 's1',
    userId: 'u1',
    userName: 'Bunga',
    userNim: '231110002',
    recordedAt: '2026-11-20T01:05:00.000Z',
  };

  it('mengubah dokumen attendance menjadi record UI', () => {
    expect(toAttendanceRecord(base)).toEqual({
      id: 's1_u1',
      sessionId: 's1',
      userId: 'u1',
      userName: 'Bunga',
      timestamp: '2026-11-20T01:05:00.000Z',
    });
  });

  it('mengosongkan timestamp yang tidak dikenali tanpa melempar error', () => {
    expect(toAttendanceRecord({ ...base, recordedAt: 123 }).timestamp).toBe('');
    expect(toAttendanceRecord({ ...base, recordedAt: { toDate: () => new Date(NaN) } }).timestamp).toBe(
      ''
    );
  });

  it('menyaring record milik user yang diminta', () => {
    const other = { ...base, id: 's1_u2', userId: 'u2', userName: 'Aditya' };

    expect(toAttendanceRecordsForUser([base, other], 'u1')).toEqual([
      expect.objectContaining({ id: 's1_u1', userId: 'u1' }),
    ]);
  });
});

describe('listener attendance', () => {
  const onSnapshotMock = jest.mocked(onSnapshot);
  const collectionMock = jest.mocked(collection);
  const queryMock = jest.mocked(query);
  const whereMock = jest.mocked(where);

  beforeEach(() => {
    onSnapshotMock.mockReset();
    collectionMock.mockReturnValue({ kind: 'collection' } as never);
    whereMock.mockReturnValue({ kind: 'where' } as never);
    queryMock.mockReturnValue({ kind: 'query' } as never);
  });

  it('listenUserAttendance memakai filter userId dan memetakan dokumen', () => {
    const unsubscribe = jest.fn();
    onSnapshotMock.mockImplementation(((...args: unknown[]) => {
      const onNext = args[1] as (snapshot: unknown) => void;
      onNext({
        docs: [
          {
            id: 's1_u1',
            data: () => ({
              sessionId: 's1',
              userId: 'u1',
              userName: 'Bunga',
              userNim: '231110002',
              recordedAt: '2026-11-20T01:05:00.000Z',
            }),
          },
        ],
      });
      return unsubscribe;
    }) as never);

    const callback = jest.fn();
    const result = listenUserAttendance('u1', callback);

    expect(whereMock).toHaveBeenCalledWith('userId', '==', 'u1');
    expect(queryMock).toHaveBeenCalledWith({ kind: 'collection' }, { kind: 'where' });
    expect(callback).toHaveBeenCalledWith([
      {
        id: 's1_u1',
        sessionId: 's1',
        userId: 'u1',
        userName: 'Bunga',
        userNim: '231110002',
        recordedAt: '2026-11-20T01:05:00.000Z',
      },
    ]);
    expect(result).toBe(unsubscribe);
  });

  it('listenAllAttendance membaca seluruh koleksi dan memetakan dokumen', () => {
    const unsubscribe = jest.fn();
    onSnapshotMock.mockImplementation(((...args: unknown[]) => {
      const onNext = args[1] as (snapshot: unknown) => void;
      onNext({
        docs: [
          {
            id: 's1_u1',
            data: () => ({
              sessionId: 's1',
              userId: 'u1',
              userName: 'Bunga',
              userNim: '231110002',
              recordedAt: '2026-11-20T01:05:00.000Z',
            }),
          },
        ],
      });
      return unsubscribe;
    }) as never);

    const callback = jest.fn();
    const result = listenAllAttendance(callback);

    expect(queryMock).not.toHaveBeenCalled();
    expect(onSnapshotMock).toHaveBeenCalledWith(
      { kind: 'collection' },
      expect.any(Function),
      expect.any(Function)
    );
    expect(callback).toHaveBeenCalledWith([
      {
        id: 's1_u1',
        sessionId: 's1',
        userId: 'u1',
        userName: 'Bunga',
        userNim: '231110002',
        recordedAt: '2026-11-20T01:05:00.000Z',
      },
    ]);
    expect(result).toBe(unsubscribe);
  });
});
