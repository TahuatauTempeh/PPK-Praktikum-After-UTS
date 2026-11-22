import type { ActivitySession } from '@/lib/laboratory-activity';
import type { Laboratory, PracticumClass } from '@/types';

import {
  buildLaboratoryMapItems,
  DEFAULT_CAMPUS_REGION,
  filterActiveLaboratories,
  findSelectedLabItem,
  formatLabLocationLabel,
  formatSessionSummary,
  getInitialMapRegion,
} from './selectors';

jest.mock('firebase/firestore', () => ({
  Timestamp: class {},
}));

function makeLab(overrides: Partial<Laboratory> = {}): Laboratory {
  return {
    id: 'lab-a',
    name: 'Lab A201',
    code: 'LAB-A',
    building: 'Gedung A',
    floor: 'Lantai 2',
    room: 'A201',
    latitude: -7.0519,
    longitude: 110.4383,
    radiusMeters: 100,
    description: 'Lab basis data',
    isActive: true,
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
    updatedBy: 'asisten-1',
    ...overrides,
  };
}

function makeClass(overrides: Partial<PracticumClass> = {}): PracticumClass {
  return {
    id: 'cls-3a',
    name: 'IF-3A',
    description: 'Basis Data',
    assistantId: 'asisten-1',
    createdAt: '2026-11-20T00:00:00Z',
    ...overrides,
  };
}

function makeSession(overrides: Partial<ActivitySession> = {}): ActivitySession {
  return {
    id: 'sesi-1',
    classId: 'cls-3a',
    title: 'Basis Data',
    date: '2026-11-23',
    startTime: '08:00',
    endTime: '09:40',
    room: 'A201',
    status: 'open',
    laboratoryId: 'lab-a',
    ...overrides,
  };
}

describe('filterActiveLaboratories', () => {
  it('menyaring hanya laboratorium dengan isActive true', () => {
    const active = makeLab({ id: 'lab-a', isActive: true });
    const inactive = makeLab({ id: 'lab-c', isActive: false });
    expect(filterActiveLaboratories([active, inactive])).toEqual([active]);
  });
});

describe('formatLabLocationLabel', () => {
  it('menggabungkan gedung, lantai, dan ruang', () => {
    expect(
      formatLabLocationLabel({ building: 'Gedung A', floor: 'Lantai 2', room: 'A201' })
    ).toBe('Gedung A · Lantai 2 · A201');
  });

  it('mengabaikan lantai jika kosong', () => {
    expect(formatLabLocationLabel({ building: 'Gedung B', floor: '', room: 'B102' })).toBe(
      'Gedung B · B102'
    );
  });
});

describe('formatSessionSummary', () => {
  it('memformat nama kelas, tanggal hari ini, jam WIB, dan label status teks', () => {
    const classMap = new Map([['cls-3a', makeClass()]]);
    const summary = formatSessionSummary(makeSession(), classMap, '2026-11-23');

    expect(summary.className).toBe('IF-3A');
    expect(summary.dateLabel).toBe('Hari ini');
    expect(summary.timeRangeWib).toBe('08.00–09.40 WIB');
    expect(summary.statusLabel).toBe('Dibuka');
  });

  it('memakai tanggal pendek untuk hari selain hari ini dan fallback nama kelas', () => {
    const summary = formatSessionSummary(
      makeSession({ classId: 'tidak-ada', date: '2026-11-24', status: 'scheduled' }),
      new Map(),
      '2026-11-23'
    );

    expect(summary.className).toBe('Praktikum');
    expect(summary.dateLabel).toBe('24 Nov 2026');
    expect(summary.statusLabel).toBe('Belum dibuka');
  });
});

describe('buildLaboratoryMapItems', () => {
  const now = new Date('2026-11-23T08:30:00+07:00');

  it('menggabungkan lab aktif, kelas, dan aktivitas Sekarang/Berikutnya', () => {
    const labs = [
      makeLab({ id: 'lab-a', name: 'Lab A201', radiusMeters: 100, isActive: true }),
      makeLab({ id: 'lab-b', name: 'Lab B102', radiusMeters: 80, isActive: true }),
      makeLab({ id: 'lab-off', name: 'Lab Nonaktif', isActive: false }),
    ];
    const classes = [
      makeClass({ id: 'cls-3a', name: 'IF-3A' }),
      makeClass({ id: 'cls-3b', name: 'IF-3B' }),
    ];
    const sessions = [
      makeSession({
        id: 's1',
        classId: 'cls-3a',
        title: 'Basis Data',
        status: 'open',
        laboratoryId: 'lab-a',
      }),
      makeSession({
        id: 's3',
        classId: 'cls-3b',
        title: 'Struktur Data',
        date: '2026-11-24',
        startTime: '08:00',
        endTime: '09:40',
        status: 'scheduled',
        laboratoryId: 'lab-a',
      }),
    ];

    const items = buildLaboratoryMapItems(labs, sessions, classes, now);
    expect(items).toHaveLength(2);

    expect(items[0].lab.id).toBe('lab-a');
    expect(items[0].radiusLabel).toBe('100 m');
    expect(items[0].current?.title).toBe('Basis Data');
    expect(items[0].current?.className).toBe('IF-3A');
    expect(items[0].current?.statusLabel).toBe('Dibuka');
    expect(items[0].next?.title).toBe('Struktur Data');
    expect(items[0].next?.className).toBe('IF-3B');
    expect(items[0].next?.statusLabel).toBe('Belum dibuka');
    expect(items[0].hasAnyActivity).toBe(true);

    expect(items[1].lab.id).toBe('lab-b');
    expect(items[1].current).toBeNull();
    expect(items[1].next).toBeNull();
    expect(items[1].hasAnyActivity).toBe(false);
  });
});

describe('findSelectedLabItem', () => {
  it('mengembalikan item sesuai ID atau null', () => {
    const items = buildLaboratoryMapItems([makeLab({ id: 'lab-a' })], [], []);
    expect(findSelectedLabItem(items, 'lab-a')?.lab.id).toBe('lab-a');
    expect(findSelectedLabItem(items, 'lab-z')).toBeNull();
    expect(findSelectedLabItem(items, null)).toBeNull();
  });
});

describe('getInitialMapRegion', () => {
  it('mengarahkan ke laboratorium aktif pertama', () => {
    const region = getInitialMapRegion([
      makeLab({ id: 'inactive', latitude: 1, longitude: 2, isActive: false }),
      makeLab({ id: 'lab-b', latitude: -7.0508, longitude: 110.439, isActive: true }),
    ]);

    expect(region.latitude).toBe(-7.0508);
    expect(region.longitude).toBe(110.439);
  });

  it('menggunakan pusat kampus jika tidak ada laboratorium aktif yang valid', () => {
    expect(getInitialMapRegion([])).toEqual(DEFAULT_CAMPUS_REGION);
  });
});
