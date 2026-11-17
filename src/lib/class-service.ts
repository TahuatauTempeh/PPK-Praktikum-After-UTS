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

import { logActionInBatch } from '@/lib/firebase/audit';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import {
  requireNonEmpty,
  rethrowServiceError,
  toMillis,
} from '@/lib/praktikum-helpers';
import { CreateClassInput, PracticumClass, UpdateClassInput } from '@/types';

function toPracticumClass(snapshot: DocumentSnapshot<DocumentData>): PracticumClass {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    name: typeof data.name === 'string' ? data.name : '',
    description: typeof data.description === 'string' ? data.description : '',
    assistantId: typeof data.assistantId === 'string' ? data.assistantId : '',
    createdAt: data.createdAt ?? '',
  };
}

/** Mengambil semua kelas yang tersedia, urut terbaru lebih dulu. */
export async function getAllClasses(): Promise<PracticumClass[]> {
  try {
    const snapshot = await getDocs(collection(getDb(), COLLECTIONS.classes));
    return snapshot.docs
      .map(toPracticumClass)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Mengambil daftar kelas milik asisten tertentu, urut terbaru lebih dulu. */
export async function getClassesByAssistant(assistantId: string): Promise<PracticumClass[]> {
  const cleanAssistantId = requireNonEmpty(assistantId, 'ID asisten');
  try {
    const snapshot = await getDocs(
      query(
        collection(getDb(), COLLECTIONS.classes),
        where('assistantId', '==', cleanAssistantId)
      )
    );
    return snapshot.docs
      .map(toPracticumClass)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Mengambil detail satu kelas berdasarkan ID. */
export async function getClassById(classId: string): Promise<PracticumClass | null> {
  try {
    const snapshot = await getDoc(doc(getDb(), COLLECTIONS.classes, classId));
    return snapshot.exists() ? toPracticumClass(snapshot) : null;
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Membuat kelas praktikum baru dan mencatat audit log. */
export async function createClass(input: CreateClassInput): Promise<PracticumClass> {
  const name = requireNonEmpty(input.name, 'Nama kelas');
  const assistantId = requireNonEmpty(input.assistantId, 'ID asisten');
  const description = input.description.trim();

  try {
    const db = getDb();
    const classRef = doc(collection(db, COLLECTIONS.classes));
    const payload = {
      name,
      description,
      assistantId,
      createdAt: serverTimestamp(),
    };

    const batch = writeBatch(db);
    batch.set(classRef, payload);
    logActionInBatch(
      batch,
      'CREATE',
      COLLECTIONS.classes,
      classRef.id,
      null,
      { name, description, assistantId }
    );
    await batch.commit();

    const createdSnap = await getDoc(classRef);
    return createdSnap.exists()
      ? toPracticumClass(createdSnap)
      : { id: classRef.id, name, description, assistantId, createdAt: new Date().toISOString() };
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Memperbarui data kelas praktikum dan mencatat audit log. */
export async function updateClass(
  classId: string,
  input: UpdateClassInput,
  _performedBy?: string
): Promise<PracticumClass> {
  const cleanId = requireNonEmpty(classId, 'ID kelas');

  try {
    const db = getDb();
    const classRef = doc(db, COLLECTIONS.classes, cleanId);
    const currentSnap = await getDoc(classRef);
    if (!currentSnap.exists()) {
      throw new Error('Kelas tidak ditemukan.');
    }

    const current = toPracticumClass(currentSnap);
    const nextName =
      input.name !== undefined ? requireNonEmpty(input.name, 'Nama kelas') : current.name;
    const nextDescription =
      input.description !== undefined ? input.description.trim() : current.description;

    const batch = writeBatch(db);
    batch.update(classRef, {
      name: nextName,
      description: nextDescription,
    });
    logActionInBatch(
      batch,
      'UPDATE',
      COLLECTIONS.classes,
      cleanId,
      { name: current.name, description: current.description },
      { name: nextName, description: nextDescription }
    );
    await batch.commit();

    return {
      ...current,
      name: nextName,
      description: nextDescription,
    };
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Menghapus kelas praktikum dan mencatat audit log. */
export async function deleteClass(classId: string, _performedBy?: string): Promise<void> {
  const cleanId = requireNonEmpty(classId, 'ID kelas');

  try {
    const db = getDb();
    const classRef = doc(db, COLLECTIONS.classes, cleanId);
    const currentSnap = await getDoc(classRef);
    if (!currentSnap.exists()) {
      throw new Error('Kelas tidak ditemukan.');
    }

    const current = toPracticumClass(currentSnap);
    const batch = writeBatch(db);
    batch.delete(classRef);
    logActionInBatch(
      batch,
      'DELETE',
      COLLECTIONS.classes,
      cleanId,
      { name: current.name, description: current.description, assistantId: current.assistantId },
      null
    );
    await batch.commit();
  } catch (error) {
    rethrowServiceError(error);
  }
}
