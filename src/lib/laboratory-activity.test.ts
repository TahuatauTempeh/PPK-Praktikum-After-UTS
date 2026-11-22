import {
  getSessionStatusLabel,
  getWibDateAndTime,
  normalizeSessionDate,
  selectLaboratoryActivity,
  type ActivitySession,
} from './laboratory-activity';

jest.mock('firebase/firestore', () => ({
  Timestamp: class {},
}));

function makeSession(overrides: Partial<ActivitySession> = {}): ActivitySession {
  return {
    id: 'sesi-1',
    classId: 'kelas-1',
    title: 'Basis Data',
    date: '2026-11-23',
    startTime: '08:00',
    endTime: '09:40',
    room: 'A201',
    status: 'scheduled',
    laboratoryId: 'lab-a',
    ...overrides,
  };
}

describe('getSessionStatusLabel', () => {
  it('mengembalikan label teks bahasa Indonesia untuk setiap status', () => {
    expect(getSessionStatusLabel('scheduled')).toBe('Belum dibuka');
    expect(getSessionStatusLabel('open')).toBe('Dibuka');
    expect(getSessionStatusLabel('closed')).toBe('Ditutup');
  });
});

describe('getWibDateAndTime', () => {
  it('mengonversi waktu UTC ke tanggal dan jam WIB', () => {
    // 2026-11-22 17:30 UTC == 2026-11-23 00:30 WIB
    const result = getWibDateAndTime(new Date('2026-11-22T17:30:00.000Z'));
    expect(result.today).toBe('2026-11-23');
    expect(result.nowTime).toBe('00:30');
  });
});

describe('normalizeSessionDate', () => {
  it('mempertahankan YYYY-MM-DD dan menormalkan ISO string ke tanggal WIB', () => {
    expect(normalizeSessionDate('2026-11-23')).toBe('2026-11-23');
    expect(normalizeSessionDate('2026-11-22T17:30:00.000Z')).toBe('2026-11-23');
  });
});

describe('selectLaboratoryActivity', () => {
  // 2026-11-23 08:30 WIB
  const now0830 = new Date('2026-11-23T08:30:00+07:00');

  it('mengembalikan null jika laboratoryId kosong atau tidak ada sesi', () => {
    expect(selectLaboratoryActivity('', [makeSession()], now0830)).toEqual({
      current: null,
      next: null,
    });
    expect(selectLaboratoryActivity('lab-a', [], now0830)).toEqual({
      current: null,
      next: null,
    });
  });

  it('hanya memilih sesi milik laboratorium yang diminta', () => {
    const sessions = [
      makeSession({ id: 'other-lab', laboratoryId: 'lab-b', status: 'open' }),
    ];
    expect(selectLaboratoryActivity('lab-a', sessions, now0830)).toEqual({
      current: null,
      next: null,
    });
  });

  it('memilih sesi open sebagai Sekarang meski di luar rentang jamnya', () => {
    // Sekarang 08:30 WIB, sesi 10:00-11:40 sudah dibuka lebih awal
    const earlyOpen = makeSession({
      id: 's1',
      startTime: '10:00',
      endTime: '11:40',
      status: 'open',
    });
    const laterScheduled = makeSession({
      id: 's2',
      startTime: '13:00',
      endTime: '14:40',
      status: 'scheduled',
    });

    const result = selectLaboratoryActivity('lab-a', [earlyOpen, laterScheduled], now0830);
    expect(result.current?.id).toBe('s1');
    // Tidak menduplikasi s1 sebagai next
    expect(result.next?.id).toBe('s2');
  });

  it('bila ada beberapa sesi open, memilih yang paling dekat waktunya', () => {
    const inWindow = makeSession({
      id: 's-now',
      startTime: '08:00',
      endTime: '09:40',
      status: 'open',
    });
    const yesterdayOpen = makeSession({
      id: 's-old',
      date: '2026-11-22',
      startTime: '08:00',
      endTime: '09:40',
      status: 'open',
    });

    const result = selectLaboratoryActivity('lab-a', [yesterdayOpen, inWindow], now0830);
    expect(result.current?.id).toBe('s-now');
  });

  it('bila tidak ada sesi open, memilih sesi dalam rentang waktu hari ini (scheduled > closed) dan startTime terbaru', () => {
    const earlierClosed = makeSession({
      id: 's-closed',
      startTime: '08:00',
      endTime: '09:40',
      status: 'closed',
    });
    const currentScheduled = makeSession({
      id: 's-sched',
      startTime: '08:15',
      endTime: '09:40',
      status: 'scheduled',
    });

    const result = selectLaboratoryActivity('lab-a', [earlierClosed, currentScheduled], now0830);
    expect(result.current?.id).toBe('s-sched');
  });

  it('bila satu-satunya sesi di rentang waktu sekarang ditutup, Sekarang menampilkan status closed', () => {
    const closedNow = makeSession({
      id: 's-closed',
      startTime: '08:00',
      endTime: '09:40',
      status: 'closed',
    });
    const nextSession = makeSession({
      id: 's-next',
      startTime: '10:00',
      endTime: '11:40',
      status: 'scheduled',
    });

    const result = selectLaboratoryActivity('lab-a', [closedNow, nextSession], now0830);
    expect(result.current?.id).toBe('s-closed');
    expect(result.current?.status).toBe('closed');
    expect(result.next?.id).toBe('s-next');
  });

  it('memilih Berikutnya paling awal setelah now dengan status selain closed', () => {
    const closedNext = makeSession({
      id: 's-closed-later',
      startTime: '10:00',
      endTime: '11:40',
      status: 'closed',
    });
    const tomorrow = makeSession({
      id: 's-tomorrow',
      date: '2026-11-24',
      startTime: '08:00',
      endTime: '09:40',
      status: 'scheduled',
    });
    const todayAfternoon = makeSession({
      id: 's-afternoon',
      startTime: '13:00',
      endTime: '14:40',
      status: 'scheduled',
    });

    const result = selectLaboratoryActivity(
      'lab-a',
      [closedNext, tomorrow, todayAfternoon],
      now0830
    );
    expect(result.current).toBeNull();
    expect(result.next?.id).toBe('s-afternoon');
  });

  it('batas waktu: pada tepat startTime masuk rentang sekarang, pada tepat endTime tidak lagi masuk rentang sekarang', () => {
    const session = makeSession({
      id: 's-edge',
      startTime: '08:00',
      endTime: '09:40',
      status: 'scheduled',
    });

    const atStart = selectLaboratoryActivity(
      'lab-a',
      [session],
      new Date('2026-11-23T08:00:00+07:00')
    );
    expect(atStart.current?.id).toBe('s-edge');
    expect(atStart.next).toBeNull();

    const atEnd = selectLaboratoryActivity(
      'lab-a',
      [session],
      new Date('2026-11-23T09:40:00+07:00')
    );
    expect(atEnd.current).toBeNull();
    expect(atEnd.next).toBeNull();
  });
});
