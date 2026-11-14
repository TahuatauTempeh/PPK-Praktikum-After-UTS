import { getEnrollmentsByUser } from '@/lib/enrollment-service';
import {
  createMockId,
  requireNonEmpty,
  toMillis,
  validateTimeRange,
} from '@/lib/praktikum-helpers';
import { CreateSessionInput, PraktikumSession, UpdateSessionInput } from '@/types';

// TODO (Sprint 2 - Firestore): Ganti store in-memory ini dengan koleksi `sessions`
// dan panggil `logAction` dari `@/lib/audit` di setiap create/update/delete.
let mockSessions: PraktikumSession[] = [
  {
    id: 'ses-1',
    classId: 'class-basis-data',
    title: 'Pertemuan 1: Pengenalan SQL',
    date: '2026-11-10T00:00:00+07:00',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Lab Komputer A',
    assistantId: 'a1',
    status: 'closed',
    createdAt: '2026-11-01T08:00:00+07:00',
  },
  {
    id: 'ses-2',
    classId: 'class-basis-data',
    title: 'Pertemuan 2: JOIN & Subquery',
    date: '2026-11-15T00:00:00+07:00',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Lab Komputer A',
    assistantId: 'a1',
    status: 'open',
    createdAt: '2026-11-05T08:00:00+07:00',
  },
  {
    id: 'ses-3',
    classId: 'class-pemweb',
    title: 'Pertemuan 3: Validasi Formulir',
    date: '2026-11-18T00:00:00+07:00',
    startTime: '10:00',
    endTime: '12:00',
    room: 'Lab Komputer B',
    assistantId: 'a1',
    status: 'scheduled',
    createdAt: '2026-11-06T08:00:00+07:00',
  },
];

function sortSessionsChronologically(items: PraktikumSession[]): PraktikumSession[] {
  return [...items].sort((a, b) => {
    const dateDiff = toMillis(a.date) - toMillis(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

/** Mengambil daftar sesi pada kelas tertentu, urut tanggal & jam mulai. */
export async function getSessionsByClass(classId: string): Promise<PraktikumSession[]> {
  const cleanClassId = requireNonEmpty(classId, 'ID kelas');
  return sortSessionsChronologically(
    mockSessions.filter((item) => item.classId === cleanClassId)
  );
}

/** Mengambil semua sesi yang dikelola oleh asisten tertentu. */
export async function getSessionsByAssistant(assistantId: string): Promise<PraktikumSession[]> {
  const cleanAssistantId = requireNonEmpty(assistantId, 'ID asisten');
  return sortSessionsChronologically(
    mockSessions.filter((item) => item.assistantId === cleanAssistantId)
  );
}

/** Mengambil sesi praktikum milik praktikan berdasarkan kelas yang di-enroll. */
export async function getSessionsForPraktikan(userId: string): Promise<PraktikumSession[]> {
  const enrollments = await getEnrollmentsByUser(userId);
  const enrolledClassIds = new Set(enrollments.map((item) => item.classId));
  return sortSessionsChronologically(
    mockSessions.filter((item) => enrolledClassIds.has(item.classId))
  );
}

/** Mengambil detail satu sesi berdasarkan ID. */
export async function getSessionById(sessionId: string): Promise<PraktikumSession | null> {
  const found = mockSessions.find((item) => item.id === sessionId);
  return found ? { ...found } : null;
}

/** Membuat sesi praktikum baru dengan status awal `scheduled`. */
export async function createSession(input: CreateSessionInput): Promise<PraktikumSession> {
  const classId = requireNonEmpty(input.classId, 'Kelas');
  const title = requireNonEmpty(input.title, 'Judul sesi');
  const room = requireNonEmpty(input.room, 'Ruangan');
  const assistantId = requireNonEmpty(input.assistantId, 'ID asisten');
  const { startTime, endTime } = validateTimeRange(input.startTime, input.endTime);

  if (toMillis(input.date) === 0) {
    throw new Error('Tanggal sesi tidak valid.');
  }

  const created: PraktikumSession = {
    id: createMockId('ses'),
    classId,
    title,
    date: input.date,
    startTime,
    endTime,
    room,
    assistantId,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };

  mockSessions = [...mockSessions, created];
  return { ...created };
}

/** Memperbarui data sesi praktikum yang sudah ada. */
export async function updateSession(
  sessionId: string,
  input: UpdateSessionInput,
  _performedBy?: string
): Promise<PraktikumSession> {
  const index = mockSessions.findIndex((item) => item.id === sessionId);
  if (index === -1) {
    throw new Error('Sesi tidak ditemukan.');
  }

  const current = mockSessions[index];
  const nextClassId =
    input.classId !== undefined ? requireNonEmpty(input.classId, 'Kelas') : current.classId;
  const nextTitle =
    input.title !== undefined ? requireNonEmpty(input.title, 'Judul sesi') : current.title;
  const nextRoom =
    input.room !== undefined ? requireNonEmpty(input.room, 'Ruangan') : current.room;
  const nextDate = input.date !== undefined ? input.date : current.date;

  if (toMillis(nextDate) === 0) {
    throw new Error('Tanggal sesi tidak valid.');
  }

  const { startTime, endTime } = validateTimeRange(
    input.startTime ?? current.startTime,
    input.endTime ?? current.endTime
  );

  const updated: PraktikumSession = {
    ...current,
    classId: nextClassId,
    title: nextTitle,
    date: nextDate,
    startTime,
    endTime,
    room: nextRoom,
  };

  mockSessions = mockSessions.map((item) => (item.id === sessionId ? updated : item));
  return { ...updated };
}

/** Menghapus sesi praktikum berdasarkan ID. */
export async function deleteSession(sessionId: string, _performedBy?: string): Promise<void> {
  const exists = mockSessions.some((item) => item.id === sessionId);
  if (!exists) {
    throw new Error('Sesi tidak ditemukan.');
  }

  mockSessions = mockSessions.filter((item) => item.id !== sessionId);
}
