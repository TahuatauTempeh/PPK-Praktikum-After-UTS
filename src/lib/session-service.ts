import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { getEnrollmentsByUser } from '@/lib/enrollment-service';
import { logActionInBatch } from '@/lib/firebase/audit';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import {
  requireNonEmpty,
  rethrowServiceError,
  toDateInputValue,
  toMillis,
  validateTimeRange,
} from '@/lib/praktikum-helpers';
import {
  CreateSessionInput,
  PraktikumSession,
  SessionStatus,
  UpdateSessionInput,
} from '@/types';

const IN_QUERY_LIMIT = 30;

function normalizeStatus(value: unknown): SessionStatus {
  if (value === 'open' || value === 'closed') return value;
  return 'scheduled';
}

function toPraktikumSession(snapshot: DocumentSnapshot<DocumentData>): PraktikumSession {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    classId: typeof data.classId === 'string' ? data.classId : '',
    title: typeof data.title === 'string' ? data.title : '',
    // Tanggal disimpan sebagai string 'YYYY-MM-DD' (WIB), sama seperti session-actions.ts.
    // Dokumen lama yang berisi Timestamp tetap terbaca dan dinormalkan ke string.
    date: toDateInputValue(data.date),
    startTime: typeof data.startTime === 'string' ? data.startTime : '00:00',
    endTime: typeof data.endTime === 'string' ? data.endTime : '00:00',
    room: typeof data.room === 'string' ? data.room : '',
    assistantId: typeof data.assistantId === 'string' ? data.assistantId : '',
    status: normalizeStatus(data.status),
    // Sesi lama (Sprint 2) belum punya laboratorium: dibaca sebagai string kosong.
    laboratoryId: typeof data.laboratoryId === 'string' ? data.laboratoryId : '',
    createdAt: data.createdAt ?? '',
  };
}

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
  try {
    const snapshot = await getDocs(
        query(
            collection(getDb(), COLLECTIONS.sessions),
            where('classId', '==', cleanClassId)
        )
    );
    return sortSessionsChronologically(snapshot.docs.map(toPraktikumSession));
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Mengambil semua sesi yang dikelola oleh asisten tertentu. */
export async function getSessionsByAssistant(assistantId: string): Promise<PraktikumSession[]> {
  const cleanAssistantId = requireNonEmpty(assistantId, 'ID asisten');
  try {
    const snapshot = await getDocs(
        query(
            collection(getDb(), COLLECTIONS.sessions),
            where('assistantId', '==', cleanAssistantId)
        )
    );
    return sortSessionsChronologically(snapshot.docs.map(toPraktikumSession));
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Mengambil sesi praktikum milik praktikan berdasarkan kelas yang di-enroll. */
export async function getSessionsForPraktikan(userId: string): Promise<PraktikumSession[]> {
  try {
    const enrollments = await getEnrollmentsByUser(userId);
    const enrolledClassIds = Array.from(new Set(enrollments.map((item) => item.classId))).filter(
        Boolean
    );
    if (enrolledClassIds.length === 0) return [];

    const db = getDb();
    const chunks: string[][] = [];
    for (let i = 0; i < enrolledClassIds.length; i += IN_QUERY_LIMIT) {
      chunks.push(enrolledClassIds.slice(i, i + IN_QUERY_LIMIT));
    }

    const snapshots = await Promise.all(
        chunks.map((chunk) =>
            getDocs(query(collection(db, COLLECTIONS.sessions), where('classId', 'in', chunk)))
        )
    );

    const combined = snapshots.flatMap((snap) => snap.docs.map(toPraktikumSession));
    return sortSessionsChronologically(combined);
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Mengambil detail satu sesi berdasarkan ID. */
export async function getSessionById(sessionId: string): Promise<PraktikumSession | null> {
  try {
    const snapshot = await getDoc(doc(getDb(), COLLECTIONS.sessions, sessionId));
    return snapshot.exists() ? toPraktikumSession(snapshot) : null;
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Membuat sesi praktikum baru dengan status awal `scheduled` dan mencatat audit log. */
export async function createSession(input: CreateSessionInput): Promise<PraktikumSession> {
  const classId = requireNonEmpty(input.classId, 'Kelas');
  const title = requireNonEmpty(input.title, 'Judul sesi');
  const room = requireNonEmpty(input.room, 'Ruangan');
  const assistantId = requireNonEmpty(input.assistantId, 'ID asisten');
  const laboratoryId = input.laboratoryId.trim();
  if (!laboratoryId) throw new Error('Pilih laboratorium.');
  const { startTime, endTime } = validateTimeRange(input.startTime, input.endTime);
  const dateValue = toDateInputValue(input.date);
  if (!dateValue) throw new Error('Tanggal tidak valid.');

  try {
    const db = getDb();
    const laboratorySnapshot = await getDoc(doc(db, COLLECTIONS.laboratories, laboratoryId));
    if (!laboratorySnapshot.exists() || laboratorySnapshot.data()?.isActive !== true) {
      throw new Error('Laboratorium tidak aktif. Pilih laboratorium lain.');
    }

    const sessionRef = doc(collection(db, COLLECTIONS.sessions));
    const payload = {
      classId,
      title,
      date: dateValue,
      startTime,
      endTime,
      room,
      assistantId,
      laboratoryId,
      status: 'scheduled' as SessionStatus,
      createdAt: serverTimestamp(),
    };

    const batch = writeBatch(db);
    batch.set(sessionRef, payload);
    logActionInBatch(
        batch,
        'CREATE',
        COLLECTIONS.sessions,
        sessionRef.id,
        null,
        {
          classId,
          title,
          date: dateValue,
          startTime,
          endTime,
          room,
          assistantId,
          laboratoryId,
          status: 'scheduled',
        }
    );
    await batch.commit();

    const createdSnap = await getDoc(sessionRef);
    return createdSnap.exists()
        ? toPraktikumSession(createdSnap)
        : {
          id: sessionRef.id,
          classId,
          title,
          date: dateValue,
          startTime,
          endTime,
          room,
          assistantId,
          laboratoryId,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
        };
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Memperbarui data sesi praktikum dan mencatat audit log. */
export async function updateSession(
    sessionId: string,
    input: UpdateSessionInput,
    _performedBy?: string
): Promise<PraktikumSession> {
  const cleanId = requireNonEmpty(sessionId, 'ID sesi');

  try {
    const db = getDb();
    const sessionRef = doc(db, COLLECTIONS.sessions, cleanId);
    const currentSnap = await getDoc(sessionRef);
    if (!currentSnap.exists()) {
      throw new Error('Sesi tidak ditemukan.');
    }

    const current = toPraktikumSession(currentSnap);
    const nextClassId =
        input.classId !== undefined ? requireNonEmpty(input.classId, 'Kelas') : current.classId;
    const nextTitle =
        input.title !== undefined ? requireNonEmpty(input.title, 'Judul sesi') : current.title;
    const nextRoom =
        input.room !== undefined ? requireNonEmpty(input.room, 'Ruangan') : current.room;
    const nextLaboratoryId =
        input.laboratoryId !== undefined ? input.laboratoryId.trim() : current.laboratoryId;
    // Sesi lama tanpa lab boleh disimpan tanpa lab (diubah nanti), tetapi sesi yang
    // sudah punya lab tidak boleh dikosongkan.
    if (current.laboratoryId && !nextLaboratoryId) throw new Error('Pilih laboratorium.');
    const nextDate = input.date !== undefined ? toDateInputValue(input.date) : current.date;
    if (!nextDate) throw new Error('Tanggal tidak valid.');
    const { startTime, endTime } = validateTimeRange(
        input.startTime ?? current.startTime,
        input.endTime ?? current.endTime
    );

    const batch = writeBatch(db);
    batch.update(sessionRef, {
      classId: nextClassId,
      title: nextTitle,
      date: nextDate,
      startTime,
      endTime,
      room: nextRoom,
      laboratoryId: nextLaboratoryId,
    });
    logActionInBatch(
        batch,
        'UPDATE',
        COLLECTIONS.sessions,
        cleanId,
        {
          classId: current.classId,
          title: current.title,
          date: current.date,
          startTime: current.startTime,
          endTime: current.endTime,
          room: current.room,
          laboratoryId: current.laboratoryId,
        },
        {
          classId: nextClassId,
          title: nextTitle,
          date: nextDate,
          startTime,
          endTime,
          room: nextRoom,
          laboratoryId: nextLaboratoryId,
        }
    );
    await batch.commit();

    return {
      ...current,
      classId: nextClassId,
      title: nextTitle,
      date: nextDate,
      startTime,
      endTime,
      room: nextRoom,
      laboratoryId: nextLaboratoryId,
    };
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Menghapus sesi praktikum dan mencatat audit log. */
export async function deleteSession(sessionId: string, _performedBy?: string): Promise<void> {
  const cleanId = requireNonEmpty(sessionId, 'ID sesi');

  try {
    const db = getDb();
    const sessionRef = doc(db, COLLECTIONS.sessions, cleanId);
    const currentSnap = await getDoc(sessionRef);
    if (!currentSnap.exists()) {
      throw new Error('Sesi tidak ditemukan.');
    }

    const current = toPraktikumSession(currentSnap);
    const batch = writeBatch(db);
    batch.delete(sessionRef);
    logActionInBatch(
        batch,
        'DELETE',
        COLLECTIONS.sessions,
        cleanId,
        {
          classId: current.classId,
          title: current.title,
          date: current.date,
          startTime: current.startTime,
          endTime: current.endTime,
          room: current.room,
          laboratoryId: current.laboratoryId,
          status: current.status,
        },
        null
    );
    await batch.commit();
  } catch (error) {
    rethrowServiceError(error);
  }
}