/**
 * Modul AI sentimen: menilai nada teks dengan model EDOM lokal di folder ai/.
 * Dipakai untuk alasan izin (task 4.2) dan kesan pesan sesi.
 *
 * Model berjalan di perangkat, jadi tidak butuh internet. Labelnya positif/netral/negatif,
 * bukan valid/invalid: model dilatih dari komentar evaluasi perkuliahan, sehingga hasilnya
 * hanya bahan pertimbangan asisten, bukan keputusan.
 */

import model from '../../ai/model-edom.json';
import { createSentimentClassifier, type SentimentLabel } from '../../ai/sentiment';

export type AiLabel = SentimentLabel;

export interface AiResult {
  label: AiLabel | null;
  confidence: number | null;
}

export const AI_TIMEOUT_MS = 10_000;

const TANPA_HASIL: AiResult = { label: null, confidence: null };

let classify: ReturnType<typeof createSentimentClassifier> | null = null;

/**
 * Model LinearSVC hanya memberi skor jarak ke batas kelas, bukan probabilitas.
 * Softmax mengubahnya ke 0..1 supaya bisa disimpan sebagai aiConfidence; angkanya perkiraan.
 */
function keyakinan(scores: number[], indeks: number): number {
  const tertinggi = Math.max(...scores);
  const eksponen = scores.map((skor) => Math.exp(skor - tertinggi));
  const total = eksponen.reduce((jumlah, nilai) => jumlah + nilai, 0);
  return Math.round((eksponen[indeks] / total) * 100) / 100;
}

function jalankanModel(teks: string): AiResult {
  classify ??= createSentimentClassifier(model);
  const prediksi = classify(teks);
  if (prediksi.label === null || prediksi.scores === null) return TANPA_HASIL;
  const indeks = prediksi.scores.indexOf(Math.max(...prediksi.scores));
  return { label: prediksi.label, confidence: keyakinan(prediksi.scores, indeks) };
}

/**
 * Hasil gagal, timeout, atau kata yang tidak dikenali model semuanya menjadi label null,
 * supaya data tetap tersimpan dan layar menampilkan "Hasil AI tidak tersedia".
 * null berarti tidak terbaca, bukan netral.
 */
export async function analisisSentimen(teks: string, batasMs: number = AI_TIMEOUT_MS): Promise<AiResult> {
  let penanda: ReturnType<typeof setTimeout> | undefined;
  const habisWaktu = new Promise<AiResult>((resolve) => {
    penanda = setTimeout(() => resolve(TANPA_HASIL), batasMs);
  });
  const analisis = new Promise<AiResult>((resolve) => {
    setTimeout(() => {
      try {
        resolve(jalankanModel(teks));
      } catch (error) {
        console.warn('[ai] analisis sentimen gagal', error);
        resolve(TANPA_HASIL);
      }
    }, 0);
  });

  try {
    return await Promise.race([analisis, habisWaktu]);
  } finally {
    clearTimeout(penanda);
  }
}

/** Nama lama untuk fitur izin; perilakunya sama dengan analisisSentimen. */
export const analisisAlasan = analisisSentimen;
