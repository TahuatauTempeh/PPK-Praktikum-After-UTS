import type { AssistantAttendance, AssistantSession } from './schedule-data';
import { buildRecap, isValidDate, monthRange } from './recap-data';

function session(overrides: Partial<AssistantSession> = {}): AssistantSession {
  return {
    id: 's1',
    code: 'C2',
    course: 'Pemrograman Web',
    topic: 'Sesi 01 | Dasar',
    className: 'IF-3A',
    date: '2026-11-20',
    startTime: '08:00',
    endTime: '09:40',
    room: 'Lab Komputer 2',
    status: 'closed',
    participantIds: ['u1', 'u2'],
    ...overrides,
  };
}

function attendance(sessionId: string, participantId: string): AssistantAttendance {
  return {
    sessionId,
    participantId,
    recordedAt: `${sessionId}-${participantId}`,
  };
}

describe('monthRange', () => {
  it('menghitung akhir bulan dengan benar', () => {
    expect(monthRange('2026-11-20')).toEqual({ start: '2026-11-01', end: '2026-11-30' });
    expect(monthRange('2026-12-01')).toEqual({ start: '2026-12-01', end: '2026-12-31' });
  });

  it('menangani Februari pada tahun kabisat dan bukan kabisat', () => {
    expect(monthRange('2026-02-10')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(monthRange('2024-02-10')).toEqual({ start: '2024-02-01', end: '2024-02-29' });
  });
});

describe('isValidDate', () => {
  it('menerima tanggal kalender yang ada', () => {
    expect(isValidDate('2026-11-20')).toBe(true);
    expect(isValidDate('2024-02-29')).toBe(true);
  });

  it('menolak format salah dan tanggal yang tidak ada', () => {
    expect(isValidDate('20-11-2026')).toBe(false);
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('0000-01-01')).toBe(false);
  });
});

describe('buildRecap', () => {
  it('hanya menghitung sesi tertutup di dalam rentang dan peserta yang terdaftar', () => {
    const sessions = [
      session({ id: 's1', date: '2026-11-20' }),
      session({ id: 's2', date: '2026-10-01', participantIds: ['u1'] }),
      session({ id: 's3', date: '2026-11-21', status: 'open' }),
    ];
    const attendanceRows = [
      attendance('s1', 'u1'),
      attendance('s1', 'u3'),
      attendance('s2', 'u1'),
      attendance('s3', 'u1'),
    ];

    const recap = buildRecap(sessions, attendanceRows, { start: '2026-11-01', end: '2026-11-30' }, '');

    expect(recap.rows).toHaveLength(1);
    expect(recap.rows[0]).toMatchObject({
      total: 2,
      present: 1,
      absent: 1,
      percent: 50,
    });
    expect(recap).toMatchObject({ total: 2, present: 1, percent: 50 });
  });

  it('memfilter satu sesi yang dipilih', () => {
    const sessions = [
      session({ id: 's1', date: '2026-11-20' }),
      session({ id: 's2', date: '2026-10-01', participantIds: ['u1'] }),
    ];

    const recap = buildRecap(sessions, [attendance('s1', 'u1')], null, 's2');

    expect(recap.rows.map((row) => row.session.id)).toEqual(['s2']);
    expect(recap.rows[0]).toMatchObject({ total: 1, present: 0, percent: 0 });
  });

  it('mengurutkan sesi terbaru lebih dulu', () => {
    const sessions = [
      session({ id: 'lama', date: '2026-11-01' }),
      session({ id: 'baru', date: '2026-11-20' }),
    ];

    const recap = buildRecap(sessions, [], null, '');

    expect(recap.rows.map((row) => row.session.id)).toEqual(['baru', 'lama']);
  });

  it('memakai rentang kosong untuk semua sesi tertutup', () => {
    const sessions = [
      session({ id: 's1', date: '2026-11-20' }),
      session({ id: 's2', date: '2026-10-01' }),
      session({ id: 's3', status: 'open' }),
    ];

    const recap = buildRecap(sessions, [], null, '');

    expect(recap.rows.map((row) => row.session.id)).toEqual(['s1', 's2']);
  });

  it('tidak menampilkan persentase saat tidak ada peserta', () => {
    const recap = buildRecap([session({ participantIds: [] })], [], null, '');

    expect(recap.rows[0]).toMatchObject({ total: 0, present: 0, absent: 0, percent: null });
    expect(recap.percent).toBeNull();
  });
});
