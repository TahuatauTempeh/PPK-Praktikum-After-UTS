import { createMockId, requireNonEmpty, toMillis } from '@/lib/praktikum-helpers';
import { CreateClassInput, PracticumClass, UpdateClassInput } from '@/types';

// TODO (Sprint 2 - Firestore): Ganti store in-memory ini dengan koleksi `classes`
// dan panggil `logAction` dari `@/lib/audit` di setiap create/update/delete.
let mockClasses: PracticumClass[] = [
  {
    id: 'class-basis-data',
    name: 'Basis Data C2',
    description: 'Praktikum perancangan skema relasional, SQL, dan normalisasi.',
    assistantId: 'a1',
    createdAt: '2026-10-01T08:00:00+07:00',
  },
  {
    id: 'class-pemweb',
    name: 'Pemrograman Web C1',
    description: 'Praktikum HTML, CSS, JavaScript DOM, dan integrasi API.',
    assistantId: 'a1',
    createdAt: '2026-10-02T08:00:00+07:00',
  },
];

/** Mengambil semua kelas yang tersedia, urut terbaru lebih dulu. */
export async function getAllClasses(): Promise<PracticumClass[]> {
  return [...mockClasses].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

/** Mengambil daftar kelas milik asisten tertentu, urut terbaru lebih dulu. */
export async function getClassesByAssistant(assistantId: string): Promise<PracticumClass[]> {
  const cleanAssistantId = requireNonEmpty(assistantId, 'ID asisten');
  return mockClasses
    .filter((item) => item.assistantId === cleanAssistantId)
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

/** Mengambil detail satu kelas berdasarkan ID. */
export async function getClassById(classId: string): Promise<PracticumClass | null> {
  const found = mockClasses.find((item) => item.id === classId);
  return found ? { ...found } : null;
}

/** Membuat kelas praktikum baru. */
export async function createClass(input: CreateClassInput): Promise<PracticumClass> {
  const name = requireNonEmpty(input.name, 'Nama kelas');
  const assistantId = requireNonEmpty(input.assistantId, 'ID asisten');
  const description = input.description.trim();

  const created: PracticumClass = {
    id: createMockId('cls'),
    name,
    description,
    assistantId,
    createdAt: new Date().toISOString(),
  };

  mockClasses = [created, ...mockClasses];
  return { ...created };
}

/** Memperbarui data kelas praktikum yang sudah ada. */
export async function updateClass(
  classId: string,
  input: UpdateClassInput,
  _performedBy?: string
): Promise<PracticumClass> {
  const index = mockClasses.findIndex((item) => item.id === classId);
  if (index === -1) {
    throw new Error('Kelas tidak ditemukan.');
  }

  const current = mockClasses[index];
  const nextName =
    input.name !== undefined ? requireNonEmpty(input.name, 'Nama kelas') : current.name;
  const nextDescription =
    input.description !== undefined ? input.description.trim() : current.description;

  const updated: PracticumClass = {
    ...current,
    name: nextName,
    description: nextDescription,
  };

  mockClasses = mockClasses.map((item) => (item.id === classId ? updated : item));
  return { ...updated };
}

/** Menghapus kelas praktikum berdasarkan ID. */
export async function deleteClass(classId: string, _performedBy?: string): Promise<void> {
  const exists = mockClasses.some((item) => item.id === classId);
  if (!exists) {
    throw new Error('Kelas tidak ditemukan.');
  }

  mockClasses = mockClasses.filter((item) => item.id !== classId);
}
