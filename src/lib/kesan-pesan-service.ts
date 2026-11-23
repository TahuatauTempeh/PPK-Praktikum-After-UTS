/**
 * Layanan koleksi kesanPesan: kesan dan pesan praktikan di akhir sesi, dinilai sentimennya oleh AI.
 *
 * ID dokumen {sessionId}_{uid}, sama dengan pola attendance, sehingga satu praktikan hanya bisa
 * mengisi satu kali per sesi. Syaratnya: sesi sudah ditutup dan presensinya tercatat. Label AI
 * hanya bahan pertimbangan asisten; null berarti model tidak mengenali teksnya, bukan netral.
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

import { analisisSentimen, type AiLabel } from '@/lib/ai-service';
import { logActionInBatch } from '@/lib/firebase/audit';
import { mapFirebaseError } from '@/lib/firebase/errors';
import { COLLECTIONS, getDb } from '@/lib/firebase/firestore';

/** Koleksi milik fitur ini; tidak ditambahkan ke COLLECTIONS supaya file Dev 1 tidak berubah. */
export const KOLEKSI_KESAN_PESAN = 'kesanPesan';

export const TEKS_MIN = 10;
export const TEKS_MAKS = 500;

export interface KesanPesan {
  id: string;
  sessionId: string;
  classId: string;
  userId: string;
  userName: string;
  text: string;
  aiLabel: AiLabel | null;
  aiConfidence: number | null;
  createdAt: Timestamp | null;
}

const KODE = {
  duplikat: 'kesan-pesan/duplikat',
  belumDitutup: 'kesan-pesan/belum-ditutup',
  tidakHadir: 'kesan-pesan/tidak-hadir',
  sesiTidakAda: 'kesan-pesan/sesi-tidak-ada',
  tidakValid: 'kesan-pesan/tidak-valid',
} as const;

const PESAN: Record<string, string> = {
  [KODE.duplikat]: 'Kamu sudah mengirim kesan pesan untuk sesi ini.',
  [KODE.belumDitutup]: 'Kesan pesan baru bisa dikirim setelah sesi ditutup asisten.',
  [KODE.tidakHadir]: 'Hanya praktikan yang hadir di sesi ini yang bisa mengirim kesan pesan.',
  [KODE.sesiTidakAda]: 'Sesi tidak ditemukan.',
  [KODE.tidakValid]: `Tulis kesan pesan ${TEKS_MIN} sampai ${TEKS_MAKS} karakter.`,
};

function galat(code: string) {
  return Object.assign(new Error(PESAN[code]), { code });
}

function kodeGalat(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
}

/** Pesan yang aman ditampilkan, untuk galat kesan pesan maupun galat Firebase. */
export function pesanGalatKesanPesan(error: unknown): string {
  return PESAN[kodeGalat(error)] ?? mapFirebaseError(error).message;
}

const AI_LABELS: readonly AiLabel[] = ['negatif', 'netral', 'positif'];

function teks(nilai: unknown): string {
  return typeof nilai === 'string' ? nilai : '';
}

export function toKesanPesan(snapshot: DocumentSnapshot<DocumentData>): KesanPesan {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    sessionId: teks(data.sessionId),
    classId: teks(data.classId),
    userId: teks(data.userId),
    userName: teks(data.userName),
    text: teks(data.text),
    aiLabel: AI_LABELS.includes(data.aiLabel) ? data.aiLabel : null,
    aiConfidence: typeof data.aiConfidence === 'number' ? data.aiConfidence : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
  };
}

/** Terbaru dulu. createdAt null berarti baru dikirim dan belum dikonfirmasi server. */
function urutkanTerbaru(daftar: KesanPesan[]): KesanPesan[] {
  const nilai = (item: KesanPesan) => item.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
  return [...daftar].sort((a, b) => nilai(b) - nilai(a));
}

export interface KirimKesanPesanInput {
  sessionId: string;
  userId: string;
  userName: string;
  text: string;
}

export async function kirimKesanPesan(input: KirimKesanPesanInput): Promise<KesanPesan> {
  const text = input.text.trim();
  if (!input.sessionId || text.length < TEKS_MIN || text.length > TEKS_MAKS) {
    throw galat(KODE.tidakValid);
  }

  const db = getDb();
  const id = `${input.sessionId}_${input.userId}`;

  const sesi = await getDoc(doc(db, COLLECTIONS.sessions, input.sessionId));
  if (!sesi.exists()) throw galat(KODE.sesiTidakAda);
  if (sesi.data().status !== 'closed') throw galat(KODE.belumDitutup);

  // ID presensi memakai pola yang sama dengan ID kesan pesan: {sessionId}_{uid}.
  const presensi = await getDoc(doc(db, COLLECTIONS.attendance, id));
  if (!presensi.exists()) throw galat(KODE.tidakHadir);

  // Query per userId supaya rules baca (pemilik atau asisten) tetap berlaku saat dokumen belum ada.
  const ganda = await getDocs(
    query(
      collection(db, KOLEKSI_KESAN_PESAN),
      where('userId', '==', input.userId),
      where('sessionId', '==', input.sessionId),
      limit(1)
    )
  );
  if (!ganda.empty) throw galat(KODE.duplikat);

  const ai = await analisisSentimen(text);
  const data = {
    sessionId: input.sessionId,
    classId: teks(sesi.data().classId),
    userId: input.userId,
    userName: input.userName,
    text,
    aiLabel: ai.label,
    aiConfidence: ai.confidence,
  };

  const batch = writeBatch(db);
  batch.set(doc(db, KOLEKSI_KESAN_PESAN, id), { ...data, createdAt: serverTimestamp() });
  logActionInBatch(batch, 'CREATE', KOLEKSI_KESAN_PESAN, id, null, data);
  await batch.commit();

  return { id, ...data, createdAt: null };
}

type Berhenti = () => void;

/**
 * Kesan pesan milik satu praktikan, realtime. Dipakai Detail Sesi untuk tahu sesi mana yang sudah diisi.
 * Query per userId (bukan get satu dokumen) supaya rules baca berlaku walau dokumennya belum ada.
 */
export function pantauKesanPesanSaya(
  userId: string,
  onData: (daftar: KesanPesan[]) => void,
  onError: (pesan: string) => void
): Berhenti {
  return onSnapshot(
    query(collection(getDb(), KOLEKSI_KESAN_PESAN), where('userId', '==', userId)),
    (hasil) => onData(urutkanTerbaru(hasil.docs.map(toKesanPesan))),
    (error) => onError(pesanGalatKesanPesan(error))
  );
}

/** Kesan pesan satu sesi untuk asisten, realtime. Diurutkan di klien agar tidak butuh indeks komposit. */
export function pantauKesanPesanSesi(
  sessionId: string,
  onData: (daftar: KesanPesan[]) => void,
  onError: (pesan: string) => void
): Berhenti {
  return onSnapshot(
    query(collection(getDb(), KOLEKSI_KESAN_PESAN), where('sessionId', '==', sessionId)),
    (hasil) => onData(urutkanTerbaru(hasil.docs.map(toKesanPesan))),
    (error) => onError(pesanGalatKesanPesan(error))
  );
}

/** Semua kesan pesan untuk asisten, realtime. Pengelompokan per sesi dilakukan di layar. */
export function pantauSemuaKesanPesan(
  onData: (daftar: KesanPesan[]) => void,
  onError: (pesan: string) => void
): Berhenti {
  return onSnapshot(
    collection(getDb(), KOLEKSI_KESAN_PESAN),
    (hasil) => onData(urutkanTerbaru(hasil.docs.map(toKesanPesan))),
    (error) => onError(pesanGalatKesanPesan(error))
  );
}
