import type { AttendanceDoc } from '@/lib/attendance-service';
import type { Enrollment } from '@/types';

/** Ringkasan kehadiran satu sesi; penyebut hanya peserta yang terdaftar di kelas. */
export function summarizeAttendance(
  attendance: readonly AttendanceDoc[],
  enrollments: readonly Enrollment[],
  classId: string,
) {
  const roster = new Set(
    enrollments.filter((item) => item.classId === classId).map((item) => item.userId),
  );
  const present = attendance.filter((item) => roster.has(item.userId)).length;
  const total = roster.size;
  return { present, total, percent: total ? Math.round((present / total) * 100) : null };
}
