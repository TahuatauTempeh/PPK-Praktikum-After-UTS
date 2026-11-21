import type { ExpoPushMessage } from './notification-helpers';
import {
  buildDedupeKey,
  buildPermissionBody,
  buildScheduleChangedBody,
  buildSessionOpenBody,
  chunkArray,
  cleanInvalidTokens,
  formatSessionDate,
  getEnrolledPractikan,
  getUserPushToken,
  getUpdateTime,
  isScheduleChanged,
  sendExpoPushMessages,
} from './notification-helpers';

describe('notification-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('chunkArray', () => {
    it('memotong array menjadi beberapa bagian sesuai ukuran', () => {
      const input = [1, 2, 3, 4, 5];
      const result = chunkArray(input, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('mengembalikan array kosong jika input kosong', () => {
      expect(chunkArray([], 10)).toEqual([]);
    });
  });

  describe('isScheduleChanged', () => {
    it('mengembalikan false jika transisi ke status open', () => {
      const before = { status: 'scheduled', date: '2026-11-20' };
      const after = { status: 'open', date: '2026-11-20' };
      expect(isScheduleChanged(before, after)).toBe(false);
    });

    it('mengembalikan true jika jam mulai berubah', () => {
      const before = { status: 'scheduled', startTime: '08:00' };
      const after = { status: 'scheduled', startTime: '09:00' };
      expect(isScheduleChanged(before, after)).toBe(true);
    });

    it('mengembalikan true jika ruangan atau lab berubah', () => {
      const before = { status: 'scheduled', room: 'Lab A' };
      const after = { status: 'scheduled', room: 'Lab B' };
      expect(isScheduleChanged(before, after)).toBe(true);
    });

    it('mengembalikan false jika field yang berubah bukan jadwal', () => {
      const before = { status: 'scheduled', updatedAt: 'time1' };
      const after = { status: 'scheduled', updatedAt: 'time2' };
      expect(isScheduleChanged(before, after)).toBe(false);
    });

    it('membandingkan Timestamp berdasarkan waktunya, bukan referensi objek', () => {
      const before = { status: 'scheduled', date: { toMillis: () => 1_700_000_000_000 } };
      const after = { status: 'scheduled', date: { toMillis: () => 1_700_000_000_000 } };
      expect(isScheduleChanged(before, after)).toBe(false);
    });
  });

  describe('payload builders', () => {
    it('menyusun body sesi dibuka dengan kelas, waktu, dan ruang', () => {
      expect(
        buildSessionOpenBody({
          title: 'Basis Data',
          className: 'IF-3A',
          startTime: '08:00',
          endTime: '10:00',
          room: 'Lab A201',
        })
      ).toBe('Basis Data — IF-3A · 08:00–10:00 · Lab A201. Presensi sudah dibuka.');
    });

    it('menyusun body sesi dibuka tanpa kelas bila kelas tidak ada', () => {
      expect(
        buildSessionOpenBody({
          title: 'Basis Data',
          className: null,
          startTime: '08:00',
          endTime: '10:00',
          room: 'Lab A201',
        })
      ).toBe('Basis Data · 08:00–10:00 · Lab A201. Presensi sudah dibuka.');
    });

    it('menyusun body perubahan jadwal', () => {
      expect(
        buildScheduleChangedBody({
          title: 'Basis Data',
          date: '2026-11-24',
          startTime: '09:00',
          endTime: '11:00',
          room: 'Lab B',
        })
      ).toBe('Basis Data — 2026-11-24 (09:00–11:00) · Lab B.');
    });

    it('menyusun body izin dengan nama dan waktu sesi', () => {
      expect(
        buildPermissionBody({
          approved: true,
          session: {
            title: 'Basis Data',
            date: '2026-11-24',
            startTime: '08:00',
            endTime: '10:00',
          },
        })
      ).toBe('Basis Data — 2026-11-24 (08:00–10:00). Pengajuan izin kamu disetujui.');
    });

    it('menyusun body izin ditolak dengan catatan asisten', () => {
      expect(
        buildPermissionBody({
          approved: false,
          session: null,
          note: 'Dokumen tidak lengkap',
        })
      ).toBe('Sesi praktikum. Pengajuan izin kamu ditolak: "Dokumen tidak lengkap".');
    });

    it('menormalkan tanggal dari string dan Timestamp', () => {
      expect(formatSessionDate('2026-11-24')).toBe('2026-11-24');
      expect(
        formatSessionDate({ toDate: () => new Date('2026-11-24T00:00:00.000Z') })
      ).toBe('2026-11-24');
    });

    it('membuat kunci dedupe yang stabil', () => {
      expect(buildDedupeKey('session-open', 's1', '2026-11-24T00:00:00.000Z')).toBe(
        'session-open:s1:2026-11-24T00:00:00.000Z'
      );
    });

    it('mengambil update time dari snapshot dan fallback ke event time', () => {
      expect(
        getUpdateTime(
          { updateTime: { toDate: () => new Date('2026-11-24T01:02:03.000Z') } },
          'event-time'
        )
      ).toBe('2026-11-24T01:02:03.000Z');
      expect(getUpdateTime({}, 'event-time')).toBe('event-time');
    });
  });

  describe('sendExpoPushMessages', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('mengembalikan 0 jika pesan kosong', async () => {
      const result = await sendExpoPushMessages([]);
      expect(result).toEqual({ successCount: 0, failureCount: 0, invalidTokens: [] });
    });

    it('mengirim pesan ke Expo dan mencatat tiket sukses dan invalid tokens', async () => {
      const mockTickets = [
        { status: 'ok', id: 'ticket-1' },
        { status: 'error', message: 'The device is not registered', details: { error: 'DeviceNotRegistered' } },
      ];

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockTickets }),
      }) as any;

      const messages: ExpoPushMessage[] = [
        { to: 'ExponentPushToken[valid]', title: 'A', body: 'B' },
        { to: 'ExponentPushToken[invalid]', title: 'A', body: 'B' },
      ];

      const result = await sendExpoPushMessages(messages);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.invalidTokens).toEqual(['ExponentPushToken[invalid]']);
    });
  });

  describe('cleanInvalidTokens', () => {
    it('mengosongkan token pada dokumen pengguna', async () => {
      const mockUpdate = jest.fn();
      const mockBatch = {
        update: mockUpdate,
        commit: jest.fn().mockResolvedValue(undefined),
      };

      const mockDb: any = {
        collection: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              docs: [{ ref: 'ref-user-1' }],
            }),
          }),
        }),
        batch: jest.fn().mockReturnValue(mockBatch),
      };

      await cleanInvalidTokens(mockDb, ['ExponentPushToken[invalid]']);
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('getEnrolledPractikan & getUserPushToken', () => {
    it('mengambil token praktikan terdaftar di kelas', async () => {
      const mockDb: any = {
        collection: jest.fn((col) => {
          if (col === 'enrollments') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ data: () => ({ userId: 'p1' }) }],
                }),
              }),
            };
          }
          if (col === 'users') {
            return {
              where: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  docs: [{ id: 'p1', data: () => ({ expoPushToken: 'ExponentPushToken[p1]' }) }],
                }),
              }),
            };
          }
          return {};
        }),
      };

      const result = await getEnrolledPractikan(mockDb, 'class-1');
      expect(result).toEqual([{ uid: 'p1', token: 'ExponentPushToken[p1]' }]);
    });

    it('mengambil token satu pengguna untuk izin praktikum', async () => {
      const mockDb: any = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ expoPushToken: 'ExponentPushToken[single]' }),
            }),
          }),
        }),
      };

      const result = await getUserPushToken(mockDb, 'user-xyz');
      expect(result).toEqual({ uid: 'user-xyz', token: 'ExponentPushToken[single]' });
    });
  });
});
