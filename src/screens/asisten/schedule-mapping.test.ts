import type { AttendanceDoc } from '@/lib/attendance-service';
import type { FirestoreSession } from '@/lib/session-actions';
import type { Enrollment } from '@/types';

import { countAttendance } from './schedule-data';
import {
  buildAssistantAttendance,
  buildAssistantParticipants,
  buildAssistantSessions,
} from './schedule-mapping';

jest.mock('firebase/firestore', () => ({
  Timestamp: class Timestamp {},
}));

function session(overrides: Partial<FirestoreSession> = {}): FirestoreSession {
  return {
    id: 's1',
    classId: 'c1',
    title: 'Sesi 1',
    date: '2026-11-20',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Lab Komputer',
    assistantId: 'a1',
    status: 'open',
    laboratoryId: 'lab1',
    createdAt: null,
    ...overrides,
  };
}

function enrollment(classId: string, userId: string): Enrollment {
  return {
    id: `${classId}_${userId}`,
    classId,
    userId,
    userName: userId,
    enrolledAt: '',
  };
}

function attendanceDoc(userId: string, recordedAt: unknown = '2026-11-20T01:05:00.000Z'): AttendanceDoc {
  return {
    id: `s1_${userId}`,
    sessionId: 's1',
    userId,
    userName: userId,
    userNim: '231110002',
    recordedAt,
  };
}

describe('buildAssistantSessions', () => {
  it('mengelompokkan peserta berdasarkan kelas dan menghapus duplikat', () => {
    const result = buildAssistantSessions(
      [session(), session({ id: 's2', classId: 'c2' })],
      [
        enrollment('c1', 'u1'),
        enrollment('c1', 'u2'),
        enrollment('c1', 'u1'),
        enrollment('c2', 'u3'),
      ]
    );

    expect(result[0].participantIds).toEqual(['u1', 'u2']);
    expect(result[1].participantIds).toEqual(['u3']);
  });

  it('memetakan status scheduled dan memakai fallback kelas kosong', () => {
    const [result] = buildAssistantSessions(
      [session({ status: 'scheduled', classId: '' })],
      []
    );

    expect(result).toMatchObject({
      status: 'pending',
      code: 'P1',
      className: 'Kelas Praktikum',
      participantIds: [],
    });
  });
});

describe('buildAssistantParticipants', () => {
  it('menghapus peserta ganda berdasarkan userId', () => {
    const enrollments = [
      { id: 'a_u1', classId: 'a', userId: 'u1', userName: 'Satu', enrolledAt: '' },
      { id: 'b_u1', classId: 'b', userId: 'u1', userName: 'Satu', enrolledAt: '' },
      { id: 'a_u2', classId: 'a', userId: 'u2', userName: 'Dua', enrolledAt: '' },
    ] as Enrollment[];

    expect(buildAssistantParticipants(enrollments)).toEqual([
      { id: 'u1', name: 'Satu' },
      { id: 'u2', name: 'Dua' },
    ]);
  });
});

describe('buildAssistantAttendance', () => {
  it('memetakan timestamp valid dan mengosongkan nilai yang tidak dikenali', () => {
    const docs = [
      attendanceDoc('u1', { toDate: () => new Date('2026-11-20T01:05:00.000Z') }),
      attendanceDoc('u2', 123),
    ];

    expect(buildAssistantAttendance(docs)).toEqual([
      {
        sessionId: 's1',
        participantId: 'u1',
        recordedAt: '2026-11-20T01:05:00.000Z',
      },
      { sessionId: 's1', participantId: 'u2', recordedAt: '' },
    ]);
  });

  it('menghitung hanya kehadiran peserta yang terdaftar', () => {
    const [result] = buildAssistantSessions(
      [session()],
      [enrollment('c1', 'u1'), enrollment('c1', 'u2')]
    );
    const records = buildAssistantAttendance([
      attendanceDoc('u1'),
      attendanceDoc('u9'),
    ]);

    expect(countAttendance(result, records)).toBe(1);
  });
});
