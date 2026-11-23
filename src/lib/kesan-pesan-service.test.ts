import { Timestamp, getDoc, getDocs, writeBatch, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';

import { analisisSentimen } from '@/lib/ai-service';
import { logActionInBatch } from '@/lib/firebase/audit';

import { kirimKesanPesan, pesanGalatKesanPesan, toKesanPesan } from './kesan-pesan-service';

jest.mock('firebase/firestore', () => {
  class FakeTimestamp {
    nilai: number;
    constructor(nilai: number) {
      this.nilai = nilai;
    }
    toMillis() {
      return this.nilai;
    }
  }
  return {
    Timestamp: FakeTimestamp,
    collection: jest.fn((_db: unknown, nama: string) => ({ nama })),
    doc: jest.fn((_db: unknown, nama: string, id: string) => ({ path: `${nama}/${id}` })),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(),
    query: jest.fn(),
    serverTimestamp: jest.fn(() => 'SERVER_TS'),
    where: jest.fn(),
    writeBatch: jest.fn(),
  };
});
jest.mock('@/lib/firebase/firestore', () => ({
  getDb: jest.fn(() => ({})),
  COLLECTIONS: { sessions: 'sessions', attendance: 'attendance' },
}));
jest.mock('@/lib/firebase/audit', () => ({ logActionInBatch: jest.fn() }));
jest.mock('@/lib/ai-service', () => ({ analisisSentimen: jest.fn() }));

const batch = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };

// clearMocks tidak membuang antrean mockResolvedValueOnce yang belum terpakai oleh test sebelumnya.
beforeEach(() => {
  jest.mocked(getDoc).mockReset();
  jest.mocked(getDocs).mockReset();
});

function snap(data: Record<string, unknown> | null) {
  return { exists: () => data !== null, data: () => data } as unknown as DocumentSnapshot<DocumentData>;
}

const INPUT = { sessionId: 's1', userId: 'u1', userName: 'Bunga', text: '  Asisten menjelaskan dengan sabar.  ' };

function siapkan({
  sesi = { status: 'closed', classId: 'c1' } as Record<string, unknown> | null,
  hadir = true,
  sudahAda = false,
} = {}) {
  jest.mocked(getDoc).mockResolvedValueOnce(snap(sesi)).mockResolvedValueOnce(snap(hadir ? { userId: 'u1' } : null));
  jest.mocked(getDocs).mockResolvedValue({ empty: !sudahAda } as never);
  jest.mocked(writeBatch).mockReturnValue(batch as never);
  jest.mocked(analisisSentimen).mockResolvedValue({ label: 'positif', confidence: 0.81 });
}

describe('kirimKesanPesan', () => {
  it('menyimpan kesan pesan beserta label AI dan audit log dalam satu batch', async () => {
    siapkan();

    const hasil = await kirimKesanPesan(INPUT);

    expect(analisisSentimen).toHaveBeenCalledWith('Asisten menjelaskan dengan sabar.');
    expect(batch.set).toHaveBeenCalledWith(
      { path: 'kesanPesan/s1_u1' },
      {
        sessionId: 's1',
        classId: 'c1',
        userId: 'u1',
        userName: 'Bunga',
        text: 'Asisten menjelaskan dengan sabar.',
        aiLabel: 'positif',
        aiConfidence: 0.81,
        createdAt: 'SERVER_TS',
      }
    );
    expect(logActionInBatch).toHaveBeenCalledWith(
      batch,
      'CREATE',
      'kesanPesan',
      's1_u1',
      null,
      expect.objectContaining({ aiLabel: 'positif' })
    );
    expect(batch.commit).toHaveBeenCalledTimes(1);
    expect(hasil).toMatchObject({ id: 's1_u1', aiLabel: 'positif', createdAt: null });
  });

  it('tetap menyimpan dengan label null bila AI tidak mengenali teksnya', async () => {
    siapkan();
    jest.mocked(analisisSentimen).mockResolvedValue({ label: null, confidence: null });

    await kirimKesanPesan(INPUT);

    expect(batch.set).toHaveBeenCalledWith(
      { path: 'kesanPesan/s1_u1' },
      expect.objectContaining({ aiLabel: null, aiConfidence: null })
    );
  });

  it.each([
    ['terlalu pendek', 'singkat'],
    ['terlalu panjang', 'a'.repeat(501)],
    ['hanya spasi', '           '],
  ])('menolak teks %s tanpa menyentuh Firestore', async (_, text) => {
    await expect(kirimKesanPesan({ ...INPUT, text })).rejects.toThrow('Tulis kesan pesan 10 sampai 500 karakter.');
    expect(getDoc).not.toHaveBeenCalled();
  });

  it.each<[string, Parameters<typeof siapkan>[0], string]>([
    ['sesi tidak ada', { sesi: null }, 'Sesi tidak ditemukan.'],
    ['sesi belum ditutup', { sesi: { status: 'open', classId: 'c1' } }, 'Kesan pesan baru bisa dikirim setelah sesi ditutup asisten.'],
    ['praktikan tidak hadir', { hadir: false }, 'Hanya praktikan yang hadir di sesi ini yang bisa mengirim kesan pesan.'],
    ['sudah pernah mengisi', { sudahAda: true }, 'Kamu sudah mengirim kesan pesan untuk sesi ini.'],
  ])('menolak bila %s', async (_, kondisi, pesan) => {
    siapkan(kondisi);
    await expect(kirimKesanPesan(INPUT)).rejects.toThrow(pesan);
    expect(batch.commit).not.toHaveBeenCalled();
    expect(analisisSentimen).not.toHaveBeenCalled();
  });
});

describe('pesanGalatKesanPesan', () => {
  it('memetakan galat Firebase ke pesan yang aman', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(pesanGalatKesanPesan({ code: 'permission-denied' })).toBe('Kamu tidak punya akses untuk tindakan ini.');
  });
});

describe('toKesanPesan', () => {
  it('menormalkan label tidak dikenal dan field yang hilang', () => {
    const hasil = toKesanPesan({
      id: 's1_u1',
      data: () => ({ text: 'Bagus', aiLabel: 'sangat-positif', aiConfidence: '0.9', createdAt: new (Timestamp as never as new (ms: number) => unknown)(5) }),
    } as unknown as DocumentSnapshot<DocumentData>);

    expect(hasil).toMatchObject({ id: 's1_u1', text: 'Bagus', aiLabel: null, aiConfidence: null, userName: '' });
    expect(hasil.createdAt).not.toBeNull();
  });
});
