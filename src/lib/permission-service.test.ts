import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

import { pesanGalatIzin, toPermissionRequest } from './permission-service';

jest.mock('firebase/firestore', () => {
  class MockTimestamp {
    private readonly milidetik: number;

    constructor(ms: number) {
      this.milidetik = ms;
    }

    toMillis() {
      return this.milidetik;
    }

    static fromDate(date: Date) {
      return new MockTimestamp(date.getTime());
    }
  }

  return {
    Timestamp: MockTimestamp,
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(),
    query: jest.fn(),
    serverTimestamp: jest.fn(),
    where: jest.fn(),
    writeBatch: jest.fn(),
  };
});

jest.mock('@/lib/ai-service', () => ({
  analisisAlasan: jest.fn(),
}));

jest.mock('@/lib/firebase/audit', () => ({
  logActionInBatch: jest.fn(),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getDb: jest.fn(() => ({})),
  COLLECTIONS: { permissionRequests: 'permissionRequests' },
}));

jest.mock('@/lib/firebase/errors', () => ({
  mapFirebaseError: jest.fn(() => ({ code: 'unknown', message: 'Pesan Firebase.' })),
}));

function snapshot(
  id: string,
  data: Record<string, unknown>,
  hasPendingWrites = false
): DocumentSnapshot<DocumentData> {
  return {
    id,
    data: () => data,
    metadata: { hasPendingWrites },
  } as unknown as DocumentSnapshot<DocumentData>;
}

describe('toPermissionRequest', () => {
  it('menormalkan dokumen izin yang lengkap', () => {
    const izin = toPermissionRequest(
      snapshot(
        'p1',
        {
          sessionId: 's1',
          userId: 'u1',
          userName: 'Bunga Maharani',
          reason: 'Sakit dan sudah memberi surat.',
          aiLabel: 'positif',
          aiConfidence: 0.8,
          status: 'pending',
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: null,
          createdAt: Timestamp.fromDate(new Date(1_000)),
        },
        true
      )
    );

    expect(izin).toMatchObject({
      id: 'p1',
      sessionId: 's1',
      userId: 'u1',
      userName: 'Bunga Maharani',
      reason: 'Sakit dan sudah memberi surat.',
      aiLabel: 'positif',
      aiConfidence: 0.8,
      status: 'pending',
      reviewedBy: null,
      reviewNote: null,
      menungguServer: true,
    });
    expect(izin.createdAt).toBeInstanceOf(Timestamp);
  });

  it('mengganti nilai yang tidak dikenal dengan default aman', () => {
    const izin = toPermissionRequest(
      snapshot('p2', {
        aiLabel: 'tidak-dikenal',
        aiConfidence: '0.9',
        status: 'menunggu',
        reviewedBy: '',
        createdAt: '2026-11-20',
      })
    );

    expect(izin.aiLabel).toBeNull();
    expect(izin.aiConfidence).toBeNull();
    expect(izin.status).toBe('pending');
    expect(izin.reviewedBy).toBeNull();
    expect(izin.createdAt).toBeNull();
    expect(izin.menungguServer).toBe(false);
  });
});

describe('pesanGalatIzin', () => {
  it('memakai pesan khusus untuk galat izin', () => {
    expect(pesanGalatIzin({ code: 'izin/duplikat' })).toBe(
      'Kamu sudah mengajukan izin untuk sesi ini.'
    );
    expect(pesanGalatIzin({ code: 'izin/sudah-ditinjau' })).toBe(
      'Izin ini sudah ditinjau asisten lain.'
    );
  });

  it('jatuh ke pemetaan galat Firebase untuk kode lain', () => {
    expect(pesanGalatIzin({ code: 'auth/invalid-email' })).toBe('Pesan Firebase.');
    expect(pesanGalatIzin(new Error('jaringan'))).toBe('Pesan Firebase.');
  });
});
