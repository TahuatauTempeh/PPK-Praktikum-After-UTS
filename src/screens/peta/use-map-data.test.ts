import { act, renderHook } from '@testing-library/react-native';

import { listenAllClasses } from '@/lib/class-service';
import { listenLaboratories } from '@/lib/laboratory-service';
import { listenAllSessions, type FirestoreSession } from '@/lib/session-actions';
import type { Laboratory, PracticumClass } from '@/types';

import { useMapData } from './use-map-data';

jest.mock('@/lib/laboratory-service', () => ({
  listenLaboratories: jest.fn(),
}));
jest.mock('@/lib/session-actions', () => ({
  listenAllSessions: jest.fn(),
}));
jest.mock('@/lib/class-service', () => ({
  listenAllClasses: jest.fn(),
}));

const mockListenLabs = listenLaboratories as jest.MockedFunction<typeof listenLaboratories>;
const mockListenSessions = listenAllSessions as jest.MockedFunction<typeof listenAllSessions>;
const mockListenClasses = listenAllClasses as jest.MockedFunction<typeof listenAllClasses>;

const sampleLab: Laboratory = {
  id: 'lab-a',
  name: 'Lab A201',
  code: 'LAB-A',
  building: 'Gedung A',
  floor: 'Lantai 2',
  room: 'A201',
  latitude: -7.0519,
  longitude: 110.4383,
  radiusMeters: 100,
  description: '',
  isActive: true,
  createdAt: '2026-11-20T00:00:00Z',
  updatedAt: '2026-11-20T00:00:00Z',
  updatedBy: 'asisten-1',
};

const sampleClass: PracticumClass = {
  id: 'cls-1',
  name: 'IF-3A',
  description: '',
  assistantId: 'asisten-1',
  createdAt: '2026-11-20T00:00:00Z',
};

const sampleSession: FirestoreSession = {
  id: 'sesi-1',
  classId: 'cls-1',
  title: 'Basis Data',
  date: '2026-11-23',
  startTime: '08:00',
  endTime: '09:40',
  room: 'A201',
  assistantId: 'asisten-1',
  status: 'open',
  laboratoryId: 'lab-a',
  createdAt: '2026-11-20T00:00:00Z',
};

describe('useMapData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('menggabungkan listener lab, sesi, dan kelas serta membersihkan listener saat unmount', async () => {
    const unsubLabs = jest.fn();
    const unsubSessions = jest.fn();
    const unsubClasses = jest.fn();

    let onLabs!: (items: Laboratory[]) => void;
    let onSessions!: (items: FirestoreSession[]) => void;
    let onClasses!: (items: PracticumClass[]) => void;

    mockListenLabs.mockImplementation((cb) => {
      onLabs = cb;
      return unsubLabs;
    });
    mockListenSessions.mockImplementation((cb) => {
      onSessions = cb;
      return unsubSessions;
    });
    mockListenClasses.mockImplementation((cb) => {
      onClasses = cb;
      return unsubClasses;
    });

    const { result, unmount } = await renderHook(() => useMapData());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      onLabs([sampleLab]);
      onSessions([sampleSession]);
      onClasses([sampleClass]);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.activeLabs).toEqual([sampleLab]);
    expect(result.current.items[0].current?.className).toBe('IF-3A');
    expect(result.current.items[0].current?.statusLabel).toBe('Dibuka');

    await unmount();
    expect(unsubLabs).toHaveBeenCalledTimes(1);
    expect(unsubSessions).toHaveBeenCalledTimes(1);
    expect(unsubClasses).toHaveBeenCalledTimes(1);
  });

  it('menampilkan error dan mengizinkan retry saat listener gagal', async () => {
    const unsubLabs = jest.fn();
    const unsubSessions = jest.fn();
    const unsubClasses = jest.fn();

    let onLabsError: ((message: string) => void) | undefined;
    let onLabsSuccess!: (items: Laboratory[]) => void;
    let onSessions!: (items: FirestoreSession[]) => void;
    let onClasses!: (items: PracticumClass[]) => void;

    mockListenLabs.mockImplementation((cb, errCb) => {
      onLabsSuccess = cb;
      onLabsError = errCb;
      return unsubLabs;
    });
    mockListenSessions.mockImplementation((cb) => {
      onSessions = cb;
      return unsubSessions;
    });
    mockListenClasses.mockImplementation((cb) => {
      onClasses = cb;
      return unsubClasses;
    });

    const { result } = await renderHook(() => useMapData());

    await act(async () => {
      onLabsError?.('Gagal memuat data laboratorium.');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Gagal memuat data laboratorium.');

    await act(async () => {
      result.current.retry();
    });

    expect(mockListenLabs).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      onLabsSuccess([sampleLab]);
      onSessions([]);
      onClasses([]);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.items).toHaveLength(1);
  });

  it('menampilkan error saat listener sesi gagal tanpa menggantung loading', async () => {
    const unsubLabs = jest.fn();
    const unsubSessions = jest.fn();
    const unsubClasses = jest.fn();

    let onLabsSuccess!: (items: Laboratory[]) => void;
    let onSessionsError: ((message: string) => void) | undefined;
    let onClassesSuccess!: (items: PracticumClass[]) => void;

    mockListenLabs.mockImplementation((cb) => {
      onLabsSuccess = cb;
      return unsubLabs;
    });
    mockListenSessions.mockImplementation((_cb, errCb) => {
      onSessionsError = errCb;
      return unsubSessions;
    });
    mockListenClasses.mockImplementation((cb) => {
      onClassesSuccess = cb;
      return unsubClasses;
    });

    const { result } = await renderHook(() => useMapData());

    await act(async () => {
      onLabsSuccess([sampleLab]);
      onClassesSuccess([sampleClass]);
      onSessionsError?.('Gagal memuat sesi praktikum.');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Gagal memuat sesi praktikum.');
    expect(result.current.items).toHaveLength(1);
  });
});
