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
}

export const ALASAN_MIN = 10;
export const ALASAN_MAKS = 500;

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
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  return PESAN[code] ?? mapFirebaseError(error).message;
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

interface AjukanIzinInput {
  sessionId: string;
  userId: string;
  userName: string;
  reason: string;
}

export async function ajukanIzin(input: AjukanIzinInput): Promise<PermissionRequest> {
  const reason = input.reason.trim();
  if (!input.sessionId || reason.length < ALASAN_MIN || reason.length > ALASAN_MAKS) {
    throw galat(KODE.tidakValid);
  }
  if (await sudahAdaIzin(input.userId, input.sessionId)) throw galat(KODE.duplikat);

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
  await batch.commit();

  return { id: ref.id, ...data, createdAt: null };
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
