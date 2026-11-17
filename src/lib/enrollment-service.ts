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
import { toUserProfile } from '@/lib/firebase/converters';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import { requireNonEmpty, rethrowServiceError } from '@/lib/praktikum-helpers';
import { CreateEnrollmentInput, Enrollment, User } from '@/types';

function toEnrollment(snapshot: DocumentSnapshot<DocumentData>): Enrollment {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    classId: typeof data.classId === 'string' ? data.classId : '',
    userId: typeof data.userId === 'string' ? data.userId : '',
    userName: typeof data.userName === 'string' ? data.userName : '',
    enrolledAt: data.enrolledAt ?? '',
  };
}

/** Mengambil daftar peserta pada kelas tertentu, urut berdasarkan nama. */
export async function getEnrollmentsByClass(classId: string): Promise<Enrollment[]> {
  const cleanClassId = requireNonEmpty(classId, 'ID kelas');
  try {
    const snapshot = await getDocs(
      query(
        collection(getDb(), COLLECTIONS.enrollments),
        where('classId', '==', cleanClassId)
      )
    );
    return snapshot.docs
      .map(toEnrollment)
      .sort((a, b) => a.userName.localeCompare(b.userName, 'id'));
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Mengambil daftar kelas yang diikuti oleh seorang praktikan. */
export async function getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
  const cleanUserId = requireNonEmpty(userId, 'ID praktikan');
  try {
    const snapshot = await getDocs(
      query(
        collection(getDb(), COLLECTIONS.enrollments),
        where('userId', '==', cleanUserId)
      )
    );
    return snapshot.docs.map(toEnrollment);
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Mengambil daftar akun praktikan terdaftar dari koleksi `users`. */
export async function getPraktikanCandidates(): Promise<User[]> {
  try {
    const snapshot = await getDocs(
      query(collection(getDb(), COLLECTIONS.users), where('role', '==', 'praktikan'))
    );
    return snapshot.docs
      .map(item => {
        const profile = toUserProfile(item);
        return {
          id: profile.id,
          name: profile.name,
          nim: profile.nim,
          role: profile.role,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Menambahkan praktikan ke dalam kelas (mencegah duplikasi dan mencatat audit log). */
export async function addEnrollment(
  input: CreateEnrollmentInput,
  _performedBy?: string
): Promise<Enrollment> {
  const classId = requireNonEmpty(input.classId, 'ID kelas');
  const userId = requireNonEmpty(input.userId, 'ID praktikan');
  const userName = requireNonEmpty(input.userName, 'Nama praktikan');

  try {
    const db = getDb();
    const enrollmentId = `${classId}_${userId}`;
    const enrollmentRef = doc(db, COLLECTIONS.enrollments, enrollmentId);

    const [existingById, existingByQuery] = await Promise.all([
      getDoc(enrollmentRef),
      getDocs(
        query(
          collection(db, COLLECTIONS.enrollments),
          where('classId', '==', classId),
          where('userId', '==', userId)
        )
      ),
    ]);

    if (existingById.exists() || !existingByQuery.empty) {
      throw new Error('Praktikan sudah terdaftar di kelas ini.');
    }

    const batch = writeBatch(db);
    batch.set(enrollmentRef, {
      classId,
      userId,
      userName,
      enrolledAt: serverTimestamp(),
    });
    logActionInBatch(
      batch,
      'CREATE',
      COLLECTIONS.enrollments,
      enrollmentId,
      null,
      { classId, userId, userName }
    );
    await batch.commit();

    const createdSnap = await getDoc(enrollmentRef);
    return createdSnap.exists()
      ? toEnrollment(createdSnap)
      : { id: enrollmentId, classId, userId, userName, enrolledAt: new Date().toISOString() };
  } catch (error) {
    rethrowServiceError(error);
  }
}

/** Menghapus peserta dari kelas dan mencatat audit log. */
export async function removeEnrollment(
  enrollmentId: string,
  _performedBy?: string
): Promise<void> {
  const cleanId = requireNonEmpty(enrollmentId, 'ID enrollment');

  try {
    const db = getDb();
    const enrollmentRef = doc(db, COLLECTIONS.enrollments, cleanId);
    const currentSnap = await getDoc(enrollmentRef);
    if (!currentSnap.exists()) {
      throw new Error('Data peserta tidak ditemukan.');
    }

    const current = toEnrollment(currentSnap);
    const batch = writeBatch(db);
    batch.delete(enrollmentRef);
    logActionInBatch(
      batch,
      'DELETE',
      COLLECTIONS.enrollments,
      cleanId,
      { classId: current.classId, userId: current.userId, userName: current.userName },
      null
    );
    await batch.commit();
  } catch (error) {
    rethrowServiceError(error);
  }
}
