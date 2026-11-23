import type { FirestoreSession } from '@/lib/session-actions';

import { keSesiAsisten, pilihTanggalAktif, tanggalHariIniWIB } from './jadwal-aktif';
import { formatPraktikumName } from './session-format';

describe('tanggalHariIniWIB', () => {
  it('memakai tanggal WIB, bukan UTC', () => {
    // 23 Nov 18.30 UTC = 24 Nov 01.30 WIB
    expect(tanggalHariIniWIB(new Date('2026-11-23T18:30:00Z'))).toBe('2026-11-24');
    expect(tanggalHariIniWIB(new Date('2026-11-23T03:00:00Z'))).toBe('2026-11-23');
  });
});

describe('pilihTanggalAktif', () => {
  it('memilih hari ini walaupun sesi pertama di daftar bertanggal lain', () => {
    expect(pilihTanggalAktif(['2026-11-28', '2026-11-23', '2026-11-24'], '2026-11-23')).toBe('2026-11-23');
  });

  it('memilih tanggal terdekat berikutnya bila hari ini tidak ada sesi', () => {
    expect(pilihTanggalAktif(['2026-11-28', '2026-11-10', '2026-11-24'], '2026-11-23')).toBe('2026-11-24');
  });

  it('memilih tanggal terakhir bila semua sesi sudah lewat', () => {
    expect(pilihTanggalAktif(['2026-11-10', '2026-11-03'], '2026-11-23')).toBe('2026-11-10');
  });

  it('mengembalikan null bila belum ada sesi bertanggal', () => {
    expect(pilihTanggalAktif([], '2026-11-23')).toBeNull();
    expect(pilihTanggalAktif([''], '2026-11-23')).toBeNull();
  });
});

describe('keSesiAsisten', () => {
  const sesi = {
    id: 's1',
    classId: '8rEDRWBcQjFnowEavFAW',
    title: 'Lambda',
    date: '2026-11-23',
    startTime: '10:00',
    endTime: '12:30',
    room: 'Lab Komputer D',
    assistantId: 'a1',
    status: 'scheduled',
    createdAt: null,
  } as FirestoreSession;

  it('memakai nama kelas sebagai judul kartu, bukan ID dokumen kelas', () => {
    const hasil = keSesiAsisten(sesi, new Map([['8rEDRWBcQjFnowEavFAW', 'Dasar Pemrograman']]));

    expect(hasil).toMatchObject({
      course: 'Dasar Pemrograman',
      topic: 'Lambda',
      className: 'Dasar Pemrograman',
      status: 'pending',
    });
    expect(formatPraktikumName(hasil)).toBe('Dasar Pemrograman');
    expect(formatPraktikumName(hasil)).not.toContain('8rEDRW');
  });

  it('memakai judul sesi sementara nama kelas belum termuat', () => {
    const hasil = keSesiAsisten(sesi, new Map());
    expect(formatPraktikumName(hasil)).toBe('Lambda');
    expect(hasil.className).toBe('Kelas Praktikum');
  });

  it('meneruskan status open dan closed apa adanya', () => {
    expect(keSesiAsisten({ ...sesi, status: 'open' }, new Map()).status).toBe('open');
    expect(keSesiAsisten({ ...sesi, status: 'closed' }, new Map()).status).toBe('closed');
  });
});
