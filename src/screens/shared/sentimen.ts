/**
 * Teks hasil AI sentimen untuk kesan pesan, dipakai di layar Kesan Pesan asisten.
 * null berarti model tidak mengenali teksnya, bukan netral (ai/README.md).
 */

import type { AiLabel } from '@/lib/ai-service';

export const LABEL_SENTIMEN: Record<AiLabel, string> = {
  positif: 'Positif',
  netral: 'Netral',
  negatif: 'Negatif',
};

export const AI_TIDAK_TERSEDIA = 'Hasil AI tidak tersedia';

/** Model dilatih dari komentar evaluasi perkuliahan dan kelas netralnya lemah, jadi hasilnya perkiraan. */
export const KETERANGAN_SENTIMEN = 'Perkiraan nada kesan pesan dari model sentimen, bukan penilaian pasti.';

export function teksLabelAi(label: AiLabel | null): string {
  return label ? LABEL_SENTIMEN[label] : AI_TIDAK_TERSEDIA;
}
