import type { AttendanceDoc } from '@/lib/attendance-service';
import { toIsoString } from '@/lib/praktikum-helpers';
import type { FirestoreSession } from '@/lib/session-actions';
import type { Enrollment } from '@/types';

import type { AssistantAttendance, AssistantSession } from './schedule-data';

function groupUserIdsByClass(enrollments: readonly Enrollment[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const item of enrollments) {
    const list = map.get(item.classId);
    if (list) list.push(item.userId);
    else map.set(item.classId, [item.userId]);
  }
  return map;
}

/** Memetakan sesi Firestore menjadi kartu jadwal asisten beserta peserta terdaftar. */
export function buildAssistantSessions(
  sessions: readonly FirestoreSession[],
  enrollments: readonly Enrollment[],
): AssistantSession[] {
  const enrolledByClass = groupUserIdsByClass(enrollments);

  return sessions.map((session) => ({
    id: session.id,
    code: session.classId || 'P1',
    course: session.title,
    topic: session.title,
    className: session.classId || 'Kelas Praktikum',
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    room: session.room,
    status: (session.status === 'scheduled' ? 'pending' : session.status) as
      | 'pending'
      | 'open'
      | 'closed',
    // Denominator memakai roster enrollment; attendance user non-enrolled tersaring di countAttendance.
    participantIds: Array.from(new Set(enrolledByClass.get(session.classId) ?? [])),
  }));
}

/** Memetakan dokumen attendance Firestore untuk perhitungan kehadiran asisten. */
export function buildAssistantAttendance(
  docs: readonly AttendanceDoc[],
): AssistantAttendance[] {
  return docs.map((item) => ({
    sessionId: item.sessionId,
    participantId: item.userId,
    recordedAt: toIsoString(item.recordedAt) ?? '',
  }));
}
