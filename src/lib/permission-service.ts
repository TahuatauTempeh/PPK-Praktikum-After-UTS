/**
 * Layanan koleksi permissionRequests (task 4.3, 4.4, 4.7).
 * Skema mengikuti SPRINT-2-PLAN.md; aiLabel berisi label sentimen dari ai-service.
 */

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { analisisAlasan, type AiLabel } from '@/lib/ai-service';
import { logActionInBatch } from '@/lib/firebase/audit';
import { mapFirebaseError } from '@/lib/firebase/errors';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';

export type PermissionStatus = 'pending' | 'approved' | 'rejected';

export interface PermissionRequest {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  reason: string;
  aiLabel: AiLabel | null;
  aiConfidence: number | null;
  status: PermissionStatus;
  reviewedBy: string | null;
  reviewedAt: Timestamp | null;
  reviewNote: string | null;
  createdAt: Timestamp | null;
  /** true selama izin baru tersimpan di perangkat dan belum diterima server (offline). */
  menungguServer: boolean;
}

export const ALASAN_MIN = 10;
export const ALASAN_MAKS = 500;

/**
 * Batas tunggu jawaban server sebelum dianggap offline. Firestore tidak menolak saat offline,
 * ia menunggu koneksi, jadi tanpa batas ini tombol kirim akan berputar terus.
 */
const BATAS_SERVER_MS = 5_000;

const KODE = {
  duplikat: 'izin/duplikat',
  sudahDitinjau: 'izin/sudah-ditinjau',
  tidakAda: 'izin/tidak-ada',
  tidakValid: 'izin/tidak-valid',
} as const;

const PESAN: Record<string, string> = {
  [KODE.duplikat]: 'Kamu sudah mengajukan izin untuk sesi ini.',
  [KODE.sudahDitinjau]: 'Izin ini sudah ditinjau asisten lain.',
  [KODE.tidakAda]: 'Izin tidak ditemukan.',
  [KODE.tidakValid]: `Pilih sesi dan tulis alasan minimal ${ALASAN_MIN} karakter.`,
};

function galat(code: string) {
  return Object.assign(new Error(PESAN[code]), { code });
}

/** Pesan yang aman ditampilkan, untuk galat izin maupun galat Firebase. */
export function pesanGalatIzin(error: unknown): string {
  return PESAN[kodeGalat(error)] ?? mapFirebaseError(error).message;
}

const AI_LABELS: readonly AiLabel[] = ['negatif', 'netral', 'positif'];
const STATUSES: readonly PermissionStatus[] = ['pending', 'approved', 'rejected'];

function teks(nilai: unknown): string {
  return typeof nilai === 'string' ? nilai : '';
}

function teksAtauNull(nilai: unknown): string | null {
  return typeof nilai === 'string' && nilai !== '' ? nilai : null;
}

function waktu(nilai: unknown): Timestamp | null {
  return nilai instanceof Timestamp ? nilai : null;
}

export function toPermissionRequest(snapshot: DocumentSnapshot<DocumentData>): PermissionRequest {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    sessionId: teks(data.sessionId),
    userId: teks(data.userId),
    userName: teks(data.userName),
    reason: teks(data.reason),
    aiLabel: AI_LABELS.includes(data.aiLabel) ? data.aiLabel : null,
    aiConfidence: typeof data.aiConfidence === 'number' ? data.aiConfidence : null,
    status: STATUSES.includes(data.status) ? data.status : 'pending',
    reviewedBy: teksAtauNull(data.reviewedBy),
    reviewedAt: waktu(data.reviewedAt),
    reviewNote: teksAtauNull(data.reviewNote),
    createdAt: waktu(data.createdAt),
    menungguServer: snapshot.metadata.hasPendingWrites,
  };
}

/** Terbaru dulu. createdAt null berarti baru dikirim dan belum dikonfirmasi server. */
function urutkanTerbaru(daftar: PermissionRequest[]): PermissionRequest[] {
  const nilai = (item: PermissionRequest) => item.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
  return [...daftar].sort((a, b) => nilai(b) - nilai(a));
}

/** Pengecekan ganda (task 4.4): query userId dan sessionId seperti di rencana sprint. */
export async function sudahAdaIzin(userId: string, sessionId: string): Promise<boolean> {
  const hasil = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.permissionRequests),
      where('userId', '==', userId),
      where('sessionId', '==', sessionId),
      limit(1)
    )
  );
  return !hasil.empty;
}

function tunggu<T>(ms: number, nilai: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(nilai), ms));
}

function kodeGalat(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
}

/**
 * true/false dari server, atau null bila server tidak terjangkau (offline atau terlalu lama).
 * Galat lain seperti permission-denied tetap dilempar.
 */
async function cekGandaDiServer(userId: string, sessionId: string): Promise<boolean | null> {
  const permintaan = sudahAdaIzin(userId, sessionId);
  try {
    return await Promise.race([permintaan, tunggu(BATAS_SERVER_MS, null)]);
  } catch (error) {
    if (kodeGalat(error) === 'unavailable') return null;
    throw error;
  } finally {
    // query yang kalah balapan tetap berjalan; galatnya jangan sampai jadi unhandled rejection
    permintaan.catch(() => undefined);
  }
}

interface AjukanIzinInput {
  sessionId: string;
  userId: string;
  userName: string;
  reason: string;
  /** Sesi yang izinnya sudah ada di riwayat perangkat; dipakai saat server tidak terjangkau. */
  sesiBerizin: ReadonlySet<string>;
}

export interface HasilAjukan {
  izin: PermissionRequest;
  /** true bila izin tersimpan di perangkat dan baru terkirim ke server saat online lagi. */
  tertunda: boolean;
}

export async function ajukanIzin(input: AjukanIzinInput): Promise<HasilAjukan> {
  const reason = input.reason.trim();
  if (!input.sessionId || reason.length < ALASAN_MIN || reason.length > ALASAN_MAKS) {
    throw galat(KODE.tidakValid);
  }
  // Cek di perangkat dulu (bisa offline), lalu cek server seperti query di rencana sprint (task 4.4).
  if (input.sesiBerizin.has(input.sessionId)) throw galat(KODE.duplikat);
  const gandaDiServer = await cekGandaDiServer(input.userId, input.sessionId);
  if (gandaDiServer) throw galat(KODE.duplikat);

  const ai = await analisisAlasan(reason);
  const ref = doc(collection(getDb(), COLLECTIONS.permissionRequests));
  const data = {
    sessionId: input.sessionId,
    userId: input.userId,
    userName: input.userName,
    reason,
    aiLabel: ai.label,
    aiConfidence: ai.confidence,
    status: 'pending' as const,
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
  };

  const batch = writeBatch(getDb());
  batch.set(ref, { ...data, createdAt: serverTimestamp() });
  logActionInBatch(batch, 'CREATE', COLLECTIONS.permissionRequests, ref.id, null, data);

  // Offline: Firestore menyimpan tulisan di perangkat, langsung tampil di riwayat lewat
  // onSnapshot, lalu mengirimnya otomatis saat koneksi kembali (task 4.8).
  const kirim = batch.commit();
  const tertunda =
    gandaDiServer === null ||
    (await Promise.race([kirim.then(() => false), tunggu(BATAS_SERVER_MS, true)]));
  if (tertunda) {
    kirim.catch((error) => console.warn('[izin] izin tertunda gagal terkirim', error));
  }

  return { izin: { id: ref.id, ...data, createdAt: null, menungguServer: tertunda }, tertunda };
}

interface TinjauIzinInput {
  id: string;
  keputusan: Exclude<PermissionStatus, 'pending'>;
  catatan: string;
  reviewerId: string;
}

export async function tinjauIzin({ id, keputusan, catatan, reviewerId }: TinjauIzinInput): Promise<void> {
  const ref = doc(getDb(), COLLECTIONS.permissionRequests, id);
  const terkini = await getDoc(ref);
  if (!terkini.exists()) throw galat(KODE.tidakAda);
  if (toPermissionRequest(terkini).status !== 'pending') throw galat(KODE.sudahDitinjau);

  const perubahan = {
    status: keputusan,
    reviewedBy: reviewerId,
    reviewNote: catatan.trim() || null,
  };

  const batch = writeBatch(getDb());
  batch.update(ref, { ...perubahan, reviewedAt: serverTimestamp() });
  logActionInBatch(
    batch,
    'UPDATE',
    COLLECTIONS.permissionRequests,
    id,
    { status: 'pending', reviewedBy: null, reviewNote: null },
    perubahan
  );
  await batch.commit();
}

type Berhenti = () => void;

/** Riwayat izin satu praktikan, realtime (task 4.5). Diurutkan di klien agar tidak butuh indeks komposit. */
export function pantauIzinSaya(
  userId: string,
  onData: (daftar: PermissionRequest[]) => void,
  onError: (pesan: string) => void
): Berhenti {
  return onSnapshot(
    query(collection(getDb(), COLLECTIONS.permissionRequests), where('userId', '==', userId)),
    // metadata ikut dipantau supaya penanda "menunggu koneksi" hilang begitu server menerima izin
    { includeMetadataChanges: true },
    (hasil) => onData(urutkanTerbaru(hasil.docs.map(toPermissionRequest))),
    (error) => onError(pesanGalatIzin(error))
  );
}

/** Semua izin untuk asisten, realtime (task 4.6). Filter status dilakukan di layar. */
export function pantauSemuaIzin(
  onData: (daftar: PermissionRequest[]) => void,
  onError: (pesan: string) => void
): Berhenti {
  return onSnapshot(
    collection(getDb(), COLLECTIONS.permissionRequests),
    (hasil) => onData(urutkanTerbaru(hasil.docs.map(toPermissionRequest))),
    (error) => onError(pesanGalatIzin(error))
  );
}

export function pantauIzin(
  id: string,
  onData: (izin: PermissionRequest | null) => void,
  onError: (pesan: string) => void
): Berhenti {
  return onSnapshot(
    doc(getDb(), COLLECTIONS.permissionRequests, id),
    (hasil) => onData(hasil.exists() ? toPermissionRequest(hasil) : null),
    (error) => onError(pesanGalatIzin(error))
  );
}
