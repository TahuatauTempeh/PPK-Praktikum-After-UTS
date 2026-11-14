import { praktikanUsers } from '@/data/dummy';
import { createMockId, requireNonEmpty } from '@/lib/praktikum-helpers';
import { CreateEnrollmentInput, Enrollment, User } from '@/types';

// TODO (Sprint 2 - Firestore): Ganti store in-memory ini dengan koleksi `enrollments`
// dan panggil `logAction` dari `@/lib/audit` di setiap tambah/hapus peserta.
let mockEnrollments: Enrollment[] = [
  {
    id: 'enr-1',
    classId: 'class-basis-data',
    userId: 'p1',
    userName: 'Ahmad Fauzi',
    enrolledAt: '2026-10-03T08:00:00+07:00',
  },
  {
    id: 'enr-2',
    classId: 'class-basis-data',
    userId: 'p2',
    userName: 'Budi Santoso',
    enrolledAt: '2026-10-03T08:05:00+07:00',
  },
  {
    id: 'enr-3',
    classId: 'class-pemweb',
    userId: 'p1',
    userName: 'Ahmad Fauzi',
    enrolledAt: '2026-10-03T08:10:00+07:00',
  },
  {
    id: 'enr-4',
    classId: 'class-pemweb',
    userId: 'p3',
    userName: 'Citra Dewi',
    enrolledAt: '2026-10-03T08:15:00+07:00',
  },
];

/** Mengambil daftar peserta pada kelas tertentu, urut berdasarkan nama. */
export async function getEnrollmentsByClass(classId: string): Promise<Enrollment[]> {
  const cleanClassId = requireNonEmpty(classId, 'ID kelas');
  return mockEnrollments
    .filter((item) => item.classId === cleanClassId)
    .sort((a, b) => a.userName.localeCompare(b.userName, 'id'));
}

/** Mengambil daftar kelas yang diikuti oleh seorang praktikan. */
export async function getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
  const cleanUserId = requireNonEmpty(userId, 'ID praktikan');
  return mockEnrollments.filter((item) => item.userId === cleanUserId);
}

/**
 * Mengambil daftar kandidat praktikan yang dapat didaftarkan ke kelas.
 * TODO (Sprint 2 - Firestore): Query koleksi `users` dengan `role == 'praktikan'`.
 */
export async function getPraktikanCandidates(): Promise<User[]> {
  return [...praktikanUsers].sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

/** Menambahkan praktikan ke dalam kelas (mencegah duplikasi pada kelas yang sama). */
export async function addEnrollment(
  input: CreateEnrollmentInput,
  _performedBy?: string
): Promise<Enrollment> {
  const classId = requireNonEmpty(input.classId, 'ID kelas');
  const userId = requireNonEmpty(input.userId, 'ID praktikan');
  const userName = requireNonEmpty(input.userName, 'Nama praktikan');

  const duplicate = mockEnrollments.some(
    (item) => item.classId === classId && item.userId === userId
  );
  if (duplicate) {
    throw new Error('Praktikan sudah terdaftar di kelas ini.');
  }

  const created: Enrollment = {
    id: createMockId('enr'),
    classId,
    userId,
    userName,
    enrolledAt: new Date().toISOString(),
  };

  mockEnrollments = [...mockEnrollments, created];
  return { ...created };
}

/** Menghapus peserta dari kelas berdasarkan ID enrollment. */
export async function removeEnrollment(
  enrollmentId: string,
  _performedBy?: string
): Promise<void> {
  const exists = mockEnrollments.some((item) => item.id === enrollmentId);
  if (!exists) {
    throw new Error('Data peserta tidak ditemukan.');
  }

  mockEnrollments = mockEnrollments.filter((item) => item.id !== enrollmentId);
}
