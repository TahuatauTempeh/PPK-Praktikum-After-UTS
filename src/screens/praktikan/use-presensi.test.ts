import { act, renderHook } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { listenMyAttendance, submitAttendanceWithLocation, type AttendanceDoc } from '@/lib/attendance-service';
import { getClassById } from '@/lib/class-service';
import { getForegroundPermission, getFreshPosition, requestForegroundPermission } from '@/lib/device-location';
import { getEnrollmentsByUser } from '@/lib/enrollment-service';
import { listenLaboratories } from '@/lib/laboratory-service';
import { listenSession, type FirestoreSession } from '@/lib/session-actions';
import type { Laboratory, UserProfile } from '@/types';

import { usePresensi } from './use-presensi';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (efek: () => void | (() => void)) => useEffect(efek, [efek]) };
});
jest.mock('@/lib/session-actions', () => ({ listenSession: jest.fn() }));
jest.mock('@/lib/attendance-service', () => ({
  listenMyAttendance: jest.fn(),
  submitAttendanceWithLocation: jest.fn(),
}));
jest.mock('@/lib/laboratory-service', () => ({ listenLaboratories: jest.fn() }));
jest.mock('@/lib/enrollment-service', () => ({ getEnrollmentsByUser: jest.fn() }));
jest.mock('@/lib/class-service', () => ({ getClassById: jest.fn() }));
jest.mock('@/lib/device-location', () => ({
  getForegroundPermission: jest.fn(),
  getFreshPosition: jest.fn(),
  requestForegroundPermission: jest.fn(),
}));

const PROFIL = { id: 'u1', name: 'Bunga', nim: '24060123', role: 'praktikan' } as UserProfile;
const LAB = {
  id: 'lab-a',
  name: 'Lab A201',
  code: 'A201',
  isActive: true,
  latitude: -7.0519,
  longitude: 110.4383,
  radiusMeters: 100,
} as Laboratory;
const SESI = {
  id: 's1',
  classId: 'c1',
  title: 'Basis Data',
  date: '2026-11-23',
  startTime: '08:00',
  endTime: '09:40',
  room: 'A201',
  assistantId: 'a1',
  status: 'open',
  laboratoryId: 'lab-a',
  createdAt: null,
} as FirestoreSession;
const DI_LAB = { latitude: LAB.latitude, longitude: LAB.longitude, accuracyMeters: 12, mocked: false, timestamp: 1 };

let kirimSesi: (sesi: FirestoreSession | null) => void;
let kirimPresensi: (doc: AttendanceDoc | null) => void;
let galatPresensi: ((pesan: string) => void) | undefined;
let kirimLab: (labs: Laboratory[]) => void;

beforeEach(() => {
  jest.mocked(listenSession).mockImplementation((_id, cb) => {
    kirimSesi = cb;
    return jest.fn();
  });
  jest.mocked(listenMyAttendance).mockImplementation((_s, _u, cb, onError) => {
    kirimPresensi = cb;
    galatPresensi = onError;
    return jest.fn();
  });
  jest.mocked(listenLaboratories).mockImplementation((cb) => {
    kirimLab = cb;
    return jest.fn();
  });
  jest.mocked(getEnrollmentsByUser).mockResolvedValue([
    { id: 'c1_u1', classId: 'c1', userId: 'u1', userName: 'Bunga', enrolledAt: '' },
  ]);
  jest.mocked(getClassById).mockResolvedValue({ id: 'c1', name: 'IF-3A', description: '', assistantId: 'a1', createdAt: '' });
  jest.mocked(getForegroundPermission).mockResolvedValue('granted');
  jest.mocked(getFreshPosition).mockResolvedValue({ ok: true, position: DI_LAB });
});

async function mulai(ubahSesi: Partial<FirestoreSession> = {}, catatan: AttendanceDoc | null = null) {
  const hook = await renderHook(() => usePresensi('s1', PROFIL));
  await act(async () => {
    kirimSesi({ ...SESI, ...ubahSesi });
    kirimPresensi(catatan);
    kirimLab([LAB]);
  });
  return hook;
}

describe('usePresensi', () => {
  it('mengaktifkan presensi saat praktikan terdaftar berada di dalam radius', async () => {
    const { result } = await mulai();

    expect(result.current.model.kelayakan.state).toBe('eligible');
    expect(result.current.model.sesi).toMatchObject({ kelas: 'IF-3A', laboratorium: 'Lab A201', asisten: null });
    expect(result.current.model.ukuran).toEqual({ distanceMeters: 0, radiusMeters: 100, accuracyMeters: 12 });
  });

  it('mengirim posisi ke callable dan menampilkan sukses dari respons server', async () => {
    jest.mocked(submitAttendanceWithLocation).mockResolvedValue({
      ok: true,
      recordedAt: '2026-11-23T01:07:00.000Z',
      distanceMeters: 0,
      radiusMeters: 100,
    });
    const { result } = await mulai();

    await act(async () => {
      result.current.onKirim();
    });

    expect(submitAttendanceWithLocation).toHaveBeenCalledWith('s1', DI_LAB, 'Lab A201');
    expect(result.current.model.kirim).toEqual({ tahap: 'berhasil', jam: '08.07', distanceMeters: 0, radiusMeters: 100 });
  });

  it('menampilkan pesan gagal dan memeriksa lokasi ulang bila server menolak jarak', async () => {
    jest.mocked(submitAttendanceWithLocation).mockResolvedValue({
      ok: false,
      code: 'OUT_OF_RADIUS',
      message: 'Kamu berada 140 m dari Lab A201. Radius yang diizinkan 100 m.',
    });
    const { result } = await mulai();
    jest.mocked(getFreshPosition).mockClear();

    await act(async () => {
      result.current.onKirim();
    });

    expect(result.current.model.kirim).toEqual({
      tahap: 'gagal',
      pesan: 'Kamu berada 140 m dari Lab A201. Radius yang diizinkan 100 m.',
    });
    expect(getFreshPosition).toHaveBeenCalledTimes(1);
  });

  it('tidak mengirim apa pun saat di luar radius', async () => {
    jest.mocked(getFreshPosition).mockResolvedValue({ ok: true, position: { ...DI_LAB, latitude: -7.054 } });
    const { result } = await mulai();

    expect(result.current.model.kelayakan.state).toBe('out-of-radius');
    await act(async () => {
      result.current.onKirim();
    });
    expect(submitAttendanceWithLocation).not.toHaveBeenCalled();
  });

  it('meminta izin hanya setelah praktikan menekan tombol', async () => {
    jest.mocked(getForegroundPermission).mockResolvedValue('undetermined');
    jest.mocked(requestForegroundPermission).mockResolvedValue('granted');
    const { result } = await mulai();

    expect(result.current.model.kelayakan.state).toBe('permission-needed');
    expect(requestForegroundPermission).not.toHaveBeenCalled();

    jest.mocked(getForegroundPermission).mockResolvedValue('granted');
    await act(async () => {
      result.current.onAksiLokasi('izinkan');
    });
    expect(result.current.model.kelayakan.state).toBe('eligible');
  });

  it('membedakan izin diblokir dan membuka pengaturan aplikasi', async () => {
    jest.mocked(getForegroundPermission).mockResolvedValue('denied');
    jest.mocked(getFreshPosition).mockResolvedValue({ ok: false, code: 'PERMISSION_BLOCKED', message: '' });
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const { result } = await mulai();

    expect(result.current.model.kelayakan.state).toBe('permission-blocked');
    await act(async () => {
      result.current.onAksiLokasi('buka-pengaturan');
    });
    expect(openSettings).toHaveBeenCalled();
  });

  it.each([
    ['SERVICES_DISABLED', 'services-disabled'],
    ['TIMEOUT', 'location-unavailable'],
  ] as const)('memetakan kegagalan lokasi %s', async (code, state) => {
    jest.mocked(getFreshPosition).mockResolvedValue({ ok: false, code, message: '' });
    const { result } = await mulai();
    expect(result.current.model.kelayakan.state).toBe(state);
  });

  it('tidak membaca lokasi bila praktikan bukan peserta kelas', async () => {
    jest.mocked(getEnrollmentsByUser).mockResolvedValue([]);
    const { result } = await mulai();

    expect(result.current.model.kelayakan.state).toBe('not-enrolled');
    expect(getFreshPosition).not.toHaveBeenCalled();
  });

  it('menolak sesi tanpa laboratorium tanpa membaca lokasi', async () => {
    const { result } = await mulai({ laboratoryId: '' });

    expect(result.current.model.kelayakan.state).toBe('lab-missing');
    expect(getFreshPosition).not.toHaveBeenCalled();
  });

  it('menonaktifkan aksi saat sesi ditutup secara realtime', async () => {
    const { result } = await mulai();
    await act(async () => {
      kirimSesi({ ...SESI, status: 'closed' });
    });
    expect(result.current.model.kelayakan).toMatchObject({ state: 'session-closed', tombolAktif: false });
  });

  it('menampilkan presensi yang sudah ada tanpa membaca lokasi', async () => {
    const lama = {
      id: 's1_u1',
      sessionId: 's1',
      userId: 'u1',
      userName: 'Bunga',
      userNim: '24060123',
      recordedAt: { toDate: () => new Date('2026-11-23T01:05:00.000Z') },
    } as AttendanceDoc;
    const { result } = await mulai({}, lama);

    expect(result.current.model.catatan).toEqual({ jam: '08.05', adaBuktiLokasi: false, distanceMeters: null });
    expect(result.current.model.kelayakan.alasan).toBe('Sudah presensi pukul 08.05 WIB');
    expect(getFreshPosition).not.toHaveBeenCalled();
  });

  it('menampilkan galat listener dan berlangganan ulang saat dimuat ulang', async () => {
    const { result } = await mulai();
    await act(async () => {
      galatPresensi?.('Kamu tidak punya akses untuk tindakan ini.');
    });
    expect(result.current.model.galatMuat).toBe('Kamu tidak punya akses untuk tindakan ini.');

    const sebelum = jest.mocked(listenSession).mock.calls.length;
    await act(async () => {
      result.current.onMuatUlang();
    });
    expect(result.current.model.galatMuat).toBeNull();
    expect(jest.mocked(listenSession).mock.calls.length).toBeGreaterThan(sebelum);
  });
});
