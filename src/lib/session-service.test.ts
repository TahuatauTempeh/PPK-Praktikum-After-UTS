import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { getDoc, writeBatch } from 'firebase/firestore';

import { logActionInBatch } from '@/lib/firebase/audit';

import { createSession } from './session-service';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({ collectionName: 'sessions' })),
  doc: jest.fn((first: unknown, collectionName?: string, id?: string) => {
    if (first && typeof first === 'object' && 'collectionName' in first) {
      return { collectionName: (first as { collectionName: string }).collectionName, id: 's1' };
    }
    return { collectionName, id };
  }),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
  where: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getDb: jest.fn(() => ({})),
  COLLECTIONS: { sessions: 'sessions', laboratories: 'laboratories' },
}));

jest.mock('@/lib/firebase/audit', () => ({
  logActionInBatch: jest.fn(),
}));

const getDocMock = jest.mocked(getDoc);
const writeBatchMock = jest.mocked(writeBatch);
const logActionInBatchMock = jest.mocked(logActionInBatch);

const batch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

function snapshot(id: string, data: Record<string, unknown> | null): DocumentSnapshot<DocumentData> {
  return {
    id,
    exists: () => data !== null,
    data: () => data,
  } as unknown as DocumentSnapshot<DocumentData>;
}

const INPUT = {
  classId: 'c1',
  title: 'Praktikum Basis Data',
  date: '2026-11-20',
  startTime: '08:00',
  endTime: '10:00',
  room: 'Lab Komputer A',
  assistantId: 'a1',
  laboratoryId: 'lab-a',
};

describe('createSession laboratorium', () => {
  beforeEach(() => {
    writeBatchMock.mockReturnValue(batch as never);
  });

  it('menolak laboratoryId kosong sebelum menyentuh Firestore', async () => {
    await expect(createSession({ ...INPUT, laboratoryId: '   ' })).rejects.toThrow(
      'Pilih laboratorium.'
    );

    expect(getDocMock).not.toHaveBeenCalled();
    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it('menolak laboratorium yang nonaktif atau tidak ditemukan', async () => {
    getDocMock.mockResolvedValueOnce(snapshot('lab-a', { isActive: false }));

    await expect(createSession(INPUT)).rejects.toThrow('Laboratorium tidak aktif.');

    expect(writeBatchMock).not.toHaveBeenCalled();
  });

  it('menyimpan laboratoryId pada sesi baru yang memakai lab aktif', async () => {
    getDocMock
      .mockResolvedValueOnce(snapshot('lab-a', { isActive: true }))
      .mockResolvedValueOnce(
        snapshot('s1', {
          ...INPUT,
          status: 'scheduled',
          createdAt: 'SERVER_TS',
        })
      );

    await expect(createSession(INPUT)).resolves.toMatchObject({
      id: 's1',
      laboratoryId: 'lab-a',
      status: 'scheduled',
    });

    expect(batch.set).toHaveBeenCalledWith(
      { collectionName: 'sessions', id: 's1' },
      expect.objectContaining({ laboratoryId: 'lab-a', status: 'scheduled' })
    );
    expect(logActionInBatchMock).toHaveBeenCalledWith(
      batch,
      'CREATE',
      'sessions',
      's1',
      null,
      expect.objectContaining({ laboratoryId: 'lab-a' })
    );
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });
});
