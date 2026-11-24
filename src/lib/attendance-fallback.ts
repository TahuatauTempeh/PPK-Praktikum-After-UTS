/**
 * Fallback presensi berbasis lokasi tanpa Cloud Functions (PRD 14.1).
 *
 * Dipakai selama project Firebase masih paket Spark. Validasinya sama dengan callable
 * (`validasiPresensi`), tetapi dijalankan di aplikasi. Firestore rules memeriksa ulang
 * sesi dibuka, enrollment, lab aktif, dan kelengkapan bukti lokasi. Jarak, akurasi, dan
 * deteksi lokasi palsu hanya diperiksa di aplikasi (client-enforced), karena rules tidak
 * punya fungsi trigonometri untuk Haversine.
 */

import { collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { buatGagal, hasilGagalDariGalat } from '@/lib/attendance-errors';
import { validasiPresensi, type HasilValidasi, type LabPresensi, type SesiPresensi } from '@/lib/attendance-rules';
import type { DevicePosition } from '@/lib/device-location';
import { getEnrollmentsByUser } from '@/lib/enrollment-service';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';
import { haversineMeters } from '@/lib/geo';
import type { AttendanceSubmitResult, UserProfile } from '@/types';

export type ProfilPresensi = Pick<UserProfile, 'id' | 'name' | 'nim'>;

/** Membatalkan transaksi tanpa menulis apa pun ketika validasi menolak */
class TolakPresensi extends Error {
  constructor(readonly hasil: Extract<HasilValidasi, { ok: false }>) {
    super(hasil.code);
  }
}

function teks(nilai: unknown): string {
  return typeof nilai === 'string' ? nilai : '';
}

function angka(nilai: unknown): number {
  return typeof nilai === 'number' && Number.isFinite(nilai) ? nilai : Number.NaN;
}

function sesiDari(data: Record<string, unknown> | undefined): SesiPresensi | null {
  if (!data) return null;
  const status = data.status;
  return { status: status === 'open' || status === 'closed' ? status : 'scheduled' };
}

function labDari(data: Record<string, unknown> | undefined): LabPresensi | null {
  if (!data) return null;
  return {
    isActive: data.isActive === true,
    latitude: angka(data.latitude),
    longitude: angka(data.longitude),
    radiusMeters: angka(data.radiusMeters),
  };
}

function keIso(nilai: unknown): string | null {
  if (nilai && typeof (nilai as { toDate?: unknown }).toDate === 'function') {
    return (nilai as { toDate(): Date }).toDate().toISOString();
  }
  return null;
}

export async function submitAttendanceViaTransaction(
  sessionId: string,
  position: DevicePosition,
  profile: ProfilPresensi,
  laboratoryName?: string,
): Promise<AttendanceSubmitResult> {
  const db = getDb();
  const uid = profile.id;
  const attendanceId = `${sessionId}_${uid}`;
  const attendanceRef = doc(db, COLLECTIONS.attendance, attendanceId);

  try {
    // Enrollment dibaca lewat query sebelum transaksi: rules `enrollments` menolak get
    // dokumen yang tidak ada, sehingga bukan peserta akan terbaca sebagai permission-denied.
    const kelasSaya = new Set((await getEnrollmentsByUser(uid)).map((item) => item.classId));

    // Rules attendance menolak `get` dokumen yang belum ada karena `resource.data.userId`
    // bernilai null. Anggap permission-denied sebagai "belum presensi"; create kedua tetap
    // ditolak rules karena dokumen yang sudah ada hanya bisa di-update oleh asisten.
    let sudahPresensi = false;
    try {
      sudahPresensi = (await getDoc(attendanceRef)).exists();
    } catch (error) {
      if ((error as { code?: string }).code !== 'permission-denied') throw error;
    }

    const hasil = await runTransaction(db, async (tx) => {
      const sessionSnap = await tx.get(doc(db, COLLECTIONS.sessions, sessionId));
      const dataSesi = sessionSnap.exists() ? sessionSnap.data() : undefined;
      const laboratoryId = teks(dataSesi?.laboratoryId);
      const labSnap = laboratoryId ? await tx.get(doc(db, COLLECTIONS.laboratories, laboratoryId)) : null;

      const dataLab = labSnap?.exists() ? labSnap.data() : undefined;
      const lab = labDari(dataLab);
      const distanceMeters = lab ? haversineMeters(position, lab) : Number.NaN;

      const validasi = validasiPresensi({
        sesi: sesiDari(dataSesi),
        terdaftar: kelasSaya.has(teks(dataSesi?.classId)),
        lab,
        sudahPresensi,
        posisi: { accuracyMeters: position.accuracyMeters, mocked: position.mocked },
        distanceMeters,
      });
      if (!validasi.ok) throw new TolakPresensi(validasi);

      const presensi = {
        sessionId,
        userId: uid,
        userName: profile.name,
        userNim: profile.nim,
        recordedAt: serverTimestamp(),
        latitude: position.latitude,
        longitude: position.longitude,
        accuracyMeters: position.accuracyMeters,
        distanceMeters: validasi.distanceMeters,
        radiusMeters: validasi.radiusMeters,
        laboratoryId,
        locationVerifiedAt: serverTimestamp(),
        mocked: position.mocked,
        source: 'location',
      };

      // Presensi dan audit log dalam satu transaksi, sama dengan callable.
      tx.set(attendanceRef, presensi);
      tx.set(doc(collection(db, COLLECTIONS.auditLogs)), {
        action: 'SUBMIT_ATTENDANCE',
        collection: COLLECTIONS.attendance,
        docId: attendanceId,
        actorUid: uid,
        actorRole: 'praktikan',
        before: null,
        after: presensi,
        timestamp: serverTimestamp(),
      });
      return validasi;
    });

    // Jam tercatat dibaca dari server; bila gagal dibaca, jam perangkat cukup untuk tampilan
    // karena listener presensi akan memperbaruinya.
    let recordedAt = new Date().toISOString();
    try {
      recordedAt = keIso((await getDoc(attendanceRef)).data()?.recordedAt) ?? recordedAt;
    } catch {
      // Presensi sudah tercatat; kegagalan membaca ulang tidak mengubah hasil.
    }

    return {
      ok: true,
      recordedAt,
      distanceMeters: hasil.distanceMeters,
      radiusMeters: hasil.radiusMeters,
    };
  } catch (error) {
    if (error instanceof TolakPresensi) {
      const { code, distanceMeters, radiusMeters } = error.hasil;
      return buatGagal(code, { distanceMeters, radiusMeters, laboratoryName });
    }
    return hasilGagalDariGalat(error, laboratoryName);
  }
}
