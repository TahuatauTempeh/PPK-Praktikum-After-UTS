/**
 * Callable `submitAttendance` (Sprint 3, PRD 7.2, 10.3, SRS 8.2 dan 9.2).
 * Satu-satunya jalur tulis `attendance`: memeriksa auth, role, sesi, enrollment, lab,
 * jarak, akurasi, mock, dan duplikat, lalu menulis presensi dan audit log dalam satu transaksi.
 */

import { FieldValue, getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall, type FunctionsErrorCode } from 'firebase-functions/v2/https';

import { validasiPresensi, type KodeTolakPresensi, type LabPresensi, type SesiPresensi } from './attendance-rules';
import { haversineMeters, isValidLatitude, isValidLongitude } from './geo';

const REGION = 'asia-southeast2';

export interface SubmitAttendanceRequest {
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  mocked?: boolean;
}

export interface SubmitAttendanceResponse {
  attendanceId: string;
  recordedAt: string; // ISO 8601
  distanceMeters: number;
  radiusMeters: number;
  laboratoryId: string;
  laboratoryName: string;
}

/** Kode HTTP dan pesan per kode domain (SRS 9.2); klien membaca kode dari `details.code` */
const TOLAK: Record<KodeTolakPresensi, { http: FunctionsErrorCode; pesan: string }> = {
  SESSION_NOT_FOUND: { http: 'not-found', pesan: 'Sesi tidak ditemukan.' },
  SESSION_NOT_OPEN: { http: 'failed-precondition', pesan: 'Sesi belum dibuka atau sudah ditutup.' },
  NOT_ENROLLED: { http: 'permission-denied', pesan: 'Kamu tidak terdaftar di sesi ini.' },
  LAB_NOT_SET: { http: 'failed-precondition', pesan: 'Laboratorium sesi belum diatur.' },
  LAB_INACTIVE: { http: 'failed-precondition', pesan: 'Laboratorium sedang tidak aktif.' },
  OUT_OF_RADIUS: { http: 'failed-precondition', pesan: 'Kamu berada di luar radius.' },
  LOCATION_INACCURATE: { http: 'failed-precondition', pesan: 'Akurasi lokasi terlalu rendah.' },
  MOCK_LOCATION: { http: 'failed-precondition', pesan: 'Lokasi palsu terdeteksi.' },
  ALREADY_PRESENT: { http: 'already-exists', pesan: 'Kamu sudah presensi.' },
};

function tolak(code: KodeTolakPresensi, detail: { distanceMeters?: number; radiusMeters?: number } = {}): HttpsError {
  return new HttpsError(TOLAK[code].http, TOLAK[code].pesan, { code, ...detail });
}

function teks(nilai: unknown): string {
  return typeof nilai === 'string' ? nilai : '';
}

function angka(nilai: unknown): number {
  return typeof nilai === 'number' && Number.isFinite(nilai) ? nilai : Number.NaN;
}

/** Validasi tipe dan rentang input sebelum menyentuh Firestore (SRS 8.2) */
export function bacaInput(data: unknown): Required<SubmitAttendanceRequest> {
  const salah = new HttpsError('invalid-argument', 'Data presensi tidak valid.');
  if (typeof data !== 'object' || data === null) throw salah;
  const d = data as Record<string, unknown>;

  const sessionId = teks(d.sessionId).trim();
  const { latitude, longitude, accuracyMeters, mocked } = d;
  if (!sessionId || sessionId.length > 200 || sessionId.includes('/')) throw salah;
  if (typeof latitude !== 'number' || !isValidLatitude(latitude)) throw salah;
  if (typeof longitude !== 'number' || !isValidLongitude(longitude)) throw salah;
  if (typeof accuracyMeters !== 'number' || !Number.isFinite(accuracyMeters) || accuracyMeters < 0) throw salah;
  if (mocked !== undefined && typeof mocked !== 'boolean') throw salah;

  return { sessionId, latitude, longitude, accuracyMeters, mocked: mocked === true };
}

function sesiDari(data: Record<string, unknown> | undefined): SesiPresensi | null {
  if (!data) return null;
  const status = data.status;
  // Status di luar state machine dianggap belum dibuka, bukan sesi yang hilang.
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

/** Firestore Admin melaporkan `create` pada dokumen yang sudah ada sebagai ALREADY_EXISTS (gRPC 6) */
function dokumenSudahAda(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return code === 6 || code === 'already-exists';
}

export async function handleSubmitAttendance(
  db: Firestore,
  uid: string | undefined,
  data: unknown,
  now: Date = new Date()
): Promise<SubmitAttendanceResponse> {
  if (!uid) throw new HttpsError('unauthenticated', 'Silakan masuk kembali.');
  const input = bacaInput(data);
  const attendanceId = `${input.sessionId}_${uid}`;
  const attendanceRef = db.collection('attendance').doc(attendanceId);

  try {
    return await db.runTransaction(async (tx) => {
      const [userSnap, sessionSnap] = await Promise.all([
        tx.get(db.collection('users').doc(uid)),
        tx.get(db.collection('sessions').doc(input.sessionId)),
      ]);

      const profil = userSnap.data();
      if (!profil || profil.role !== 'praktikan') {
        throw new HttpsError('permission-denied', 'Hanya praktikan yang dapat melakukan presensi.');
      }

      const dataSesi = sessionSnap.exists ? sessionSnap.data() : undefined;
      const classId = teks(dataSesi?.classId);
      const laboratoryId = teks(dataSesi?.laboratoryId);

      const [enrollSnap, labSnap, attendanceSnap] = await Promise.all([
        classId ? tx.get(db.collection('enrollments').doc(`${classId}_${uid}`)) : Promise.resolve(null),
        laboratoryId ? tx.get(db.collection('laboratories').doc(laboratoryId)) : Promise.resolve(null),
        tx.get(attendanceRef),
      ]);

      const dataLab = labSnap?.exists ? labSnap.data() : undefined;
      const lab = labDari(dataLab);
      const distanceMeters = lab
        ? haversineMeters({ latitude: input.latitude, longitude: input.longitude }, lab)
        : Number.NaN;

      const hasil = validasiPresensi({
        sesi: sesiDari(dataSesi),
        terdaftar: enrollSnap?.exists === true,
        lab,
        sudahPresensi: attendanceSnap.exists,
        posisi: { accuracyMeters: input.accuracyMeters, mocked: input.mocked },
        distanceMeters,
      });

      if (!hasil.ok) {
        const { code, ...detail } = hasil;
        throw tolak(code, detail);
      }

      const waktu = Timestamp.fromDate(now);
      const presensi = {
        sessionId: input.sessionId,
        userId: uid,
        userName: teks(profil.name),
        userNim: teks(profil.nim),
        recordedAt: waktu,
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyMeters: input.accuracyMeters,
        distanceMeters: hasil.distanceMeters,
        radiusMeters: hasil.radiusMeters,
        laboratoryId,
        locationVerifiedAt: waktu,
        mocked: input.mocked,
        source: 'location',
      };

      // `create` menolak dokumen yang sudah ada, jadi dua permintaan bersamaan tidak menghasilkan dua presensi.
      tx.create(attendanceRef, presensi);
      tx.create(db.collection('auditLogs').doc(), {
        action: 'SUBMIT_ATTENDANCE',
        collection: 'attendance',
        docId: attendanceId,
        actorUid: uid,
        actorRole: 'praktikan',
        before: null,
        after: presensi,
        timestamp: FieldValue.serverTimestamp(),
      });

      return {
        attendanceId,
        recordedAt: now.toISOString(),
        distanceMeters: hasil.distanceMeters,
        radiusMeters: hasil.radiusMeters,
        laboratoryId,
        laboratoryName: teks(dataLab?.name),
      };
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    if (dokumenSudahAda(error)) throw tolak('ALREADY_PRESENT');
    // Objek Error menjadi {} di log terstruktur, jadi pesan dan stack ditulis eksplisit.
    logger.error('[submitAttendance] gagal', {
      sessionId: input.sessionId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new HttpsError('internal', 'Terjadi kesalahan.');
  }
}

export const submitAttendance = onCall<unknown, Promise<SubmitAttendanceResponse>>(
  { region: REGION, maxInstances: 10 },
  (request) => handleSubmitAttendance(getFirestore(), request.auth?.uid, request.data)
);
