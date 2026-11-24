import type { AttendanceDoc } from '@/lib/attendance-service';
import type { Enrollment } from '@/types';

import { summarizeAttendance } from './session-summary';

function attendance(userId: string): AttendanceDoc {
  return {
    id: `s1_${userId}`,
    sessionId: 's1',
    userId,
    userName: userId,
    userNim: '000',
    recordedAt: null,
  };
}

function enrollment(userId: string): Enrollment {
  return {
    id: `c_${userId}`,
    classId: 'c',
    userId,
    userName: userId,
    enrolledAt: '',
  };
}

it('menghitung hanya peserta yang terdaftar', () => {
  const result = summarizeAttendance(
    [attendance('u1'), attendance('u2'), attendance('outsider')],
    [enrollment('u1'), enrollment('u2')],
    'c',
  );
  expect(result).toEqual({ present: 2, total: 2, percent: 100 });
});
