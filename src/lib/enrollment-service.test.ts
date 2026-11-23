import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { collection, getDoc, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';

import { logActionInBatch } from '@/lib/firebase/audit';

import { addEnrollment, listenAllEnrollments, removeEnrollment } from './enrollment-service';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn((_db: unknown, collectionName: string, id: string) => ({ collectionName, id })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
  where: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getDb: jest.fn(() => ({})),
  COLLECTIONS: { enrollments: 'enrollments' },
}));

jest.mock('@/lib/firebase/audit', () => ({
  logActionInBatch: jest.fn(),
}));

const getDocMock = jest.mocked(getDoc);
const getDocsMock = jest.mocked(getDocs);
const writeBatchMock = jest.mocked(writeBatch);
const logActionInBatchMock = jest.mocked(logActionInBatch);

const batch = {
  set: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

function snapshot(id: string, data: Record<string, unknown> | null): DocumentSnapshot<DocumentData> {
  return {
    id,
    exists: () => data !== null,
    data: () => data,
  } as unknown as DocumentSnapshot<DocumentData>;
}

const emptyQuery = { empty: true, docs: [] };

describe('addEnrollment', () => {
  beforeEach(() => {
    writeBatchMock.mockReturnValue(batch as never);
  });

  it('menolak input yang kosong sebelum menyentuh Firestore', async () => {
    await expect(
      addEnrollment({ classId: '', userId: 'u1', userName: 'Bunga' })
    ).rejects.toThrow('ID kelas wajib diisi.');

    expect(getDocMock).not.toHaveBeenCalled();
  });

  it('menolak peserta yang sudah punya dokumen enrollment', async () => {
    getDocMock.mockResolvedValueOnce(snapshot('c1_u1', { classId: 'c1' }));
    getDocsMock.mockResolvedValueOnce(emptyQuery as never);

    await expect(
      addEnrollment({ classId: 'c1', userId: 'u1', userName: 'Bunga' })
    ).rejects.toThrow('Praktikan sudah terdaftar di kelas ini.');

    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it('menolak peserta yang ditemukan lewat query meski ID dokumen belum ada', async () => {
    getDocMock.mockResolvedValueOnce(snapshot('c1_u1', null));
    getDocsMock.mockResolvedValueOnce({ empty: false, docs: [] } as never);

    await expect(
      addEnrollment({ classId: 'c1', userId: 'u1', userName: 'Bunga' })
    ).rejects.toThrow('Praktikan sudah terdaftar di kelas ini.');

    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it('membuat enrollment dengan ID kelas_uid dan menulis audit dalam batch', async () => {
    getDocMock
      .mockResolvedValueOnce(snapshot('c1_u1', null))
      .mockResolvedValueOnce(
        snapshot('c1_u1', {
          classId: 'c1',
          userId: 'u1',
          userName: 'Bunga',
          enrolledAt: 'SERVER_TS',
        })
      );
    getDocsMock.mockResolvedValueOnce(emptyQuery as never);

    await expect(
      addEnrollment({ classId: 'c1', userId: 'u1', userName: 'Bunga' })
    ).resolves.toMatchObject({
      id: 'c1_u1',
      classId: 'c1',
      userId: 'u1',
      userName: 'Bunga',
    });

    expect(batch.set).toHaveBeenCalledWith(
      { collectionName: 'enrollments', id: 'c1_u1' },
      { classId: 'c1', userId: 'u1', userName: 'Bunga', enrolledAt: 'SERVER_TS' }
    );
    expect(logActionInBatchMock).toHaveBeenCalledWith(
      batch,
      'CREATE',
      'enrollments',
      'c1_u1',
      null,
      { classId: 'c1', userId: 'u1', userName: 'Bunga' }
    );
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });
});

describe('removeEnrollment', () => {
  it('menolak enrollment yang tidak ditemukan', async () => {
    getDocMock.mockResolvedValueOnce(snapshot('c1_u1', null));

    await expect(removeEnrollment('c1_u1')).rejects.toThrow('Data peserta tidak ditemukan.');
    expect(writeBatchMock).not.toHaveBeenCalled();
  });
});

describe('listenAllEnrollments', () => {
  const collectionMock = jest.mocked(collection);
  const onSnapshotMock = jest.mocked(onSnapshot);

  it('memetakan snapshot enrollment dan mengembalikan unsubscribe', () => {
    const unsubscribe = jest.fn();
    collectionMock.mockReturnValue({ kind: 'collection' } as never);
    onSnapshotMock.mockImplementation(((...args: unknown[]) => {
      const onNext = args[1] as (snapshot: unknown) => void;
      onNext({
        docs: [
          snapshot('c1_u1', {
            classId: 'c1',
            userId: 'u1',
            userName: 'Bunga',
            enrolledAt: 'SERVER_TS',
          }),
        ],
      });
      return unsubscribe;
    }) as never);

    const callback = jest.fn();
    const result = listenAllEnrollments(callback);

    expect(collectionMock).toHaveBeenCalledWith({}, 'enrollments');
    expect(callback).toHaveBeenCalledWith([
      {
        id: 'c1_u1',
        classId: 'c1',
        userId: 'u1',
        userName: 'Bunga',
        enrolledAt: 'SERVER_TS',
      },
    ]);
    expect(result).toBe(unsubscribe);
  });
});
