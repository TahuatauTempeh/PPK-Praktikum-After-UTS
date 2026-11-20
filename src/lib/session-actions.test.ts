import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { getDoc, updateDoc } from 'firebase/firestore';

import { logAction } from '@/lib/firebase/audit';

import { closeSession, openSession } from './session-actions';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db: unknown, collectionName: string, id: string) => ({ collectionName, id })),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TS'),
  onSnapshot: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getDb: jest.fn(() => ({})),
  COLLECTIONS: { sessions: 'sessions' },
}));

jest.mock('@/lib/firebase/audit', () => ({
  logAction: jest.fn(),
}));

const getDocMock = jest.mocked(getDoc);
const updateDocMock = jest.mocked(updateDoc);
const logActionMock = jest.mocked(logAction);

function sessionSnapshot(status: string): DocumentSnapshot<DocumentData> {
  return {
    exists: () => true,
    id: 's1',
    data: () => ({ status }),
  } as unknown as DocumentSnapshot<DocumentData>;
}

const missingSnapshot = {
  exists: () => false,
} as unknown as DocumentSnapshot<DocumentData>;

describe('openSession', () => {
  it('menolak sesi yang tidak ditemukan', async () => {
    getDocMock.mockResolvedValueOnce(missingSnapshot);

    await expect(openSession('s1')).resolves.toEqual({
      success: false,
      message: 'Sesi tidak ditemukan.',
    });
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('menolak sesi yang statusnya bukan scheduled', async () => {
    getDocMock.mockResolvedValueOnce(sessionSnapshot('open'));

    const result = await openSession('s1');

    expect(result.success).toBe(false);
    expect(result.message).toContain('tidak bisa dibuka');
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('mengubah scheduled menjadi open dan menulis audit log', async () => {
    getDocMock.mockResolvedValueOnce(sessionSnapshot('scheduled'));

    await expect(openSession('s1')).resolves.toEqual({
      success: true,
      message: 'Sesi berhasil dibuka.',
    });
    expect(updateDocMock).toHaveBeenCalledWith(
      { collectionName: 'sessions', id: 's1' },
      { status: 'open', openedAt: 'SERVER_TS' }
    );
    expect(logActionMock).toHaveBeenCalledWith(
      'OPEN_SESSION',
      'sessions',
      's1',
      { status: 'scheduled' },
      { status: 'open' }
    );
  });
});

describe('closeSession', () => {
  it('menolak sesi yang tidak ditemukan', async () => {
    getDocMock.mockResolvedValueOnce(missingSnapshot);

    await expect(closeSession('s1')).resolves.toEqual({
      success: false,
      message: 'Sesi tidak ditemukan.',
    });
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('menolak sesi yang belum dibuka', async () => {
    getDocMock.mockResolvedValueOnce(sessionSnapshot('scheduled'));

    const result = await closeSession('s1');

    expect(result.success).toBe(false);
    expect(result.message).toContain('tidak bisa ditutup');
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('mengubah open menjadi closed dan menulis audit log', async () => {
    getDocMock.mockResolvedValueOnce(sessionSnapshot('open'));

    await expect(closeSession('s1')).resolves.toEqual({
      success: true,
      message: 'Sesi berhasil ditutup.',
    });
    expect(updateDocMock).toHaveBeenCalledWith(
      { collectionName: 'sessions', id: 's1' },
      { status: 'closed', closedAt: 'SERVER_TS' }
    );
    expect(logActionMock).toHaveBeenCalledWith(
      'CLOSE_SESSION',
      'sessions',
      's1',
      { status: 'open' },
      { status: 'closed' }
    );
  });

  it('mengembalikan pesan aman saat Firestore gagal', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocMock.mockRejectedValueOnce(new Error('network down'));

    await expect(closeSession('s1')).resolves.toEqual({
      success: false,
      message: 'Gagal menutup sesi. Coba lagi.',
    });
  });
});
