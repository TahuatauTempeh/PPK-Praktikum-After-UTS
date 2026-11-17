/**
 * Teks tampilan izin yang dipakai sisi Praktikan dan Asisten, supaya istilahnya sama di kedua sisi.
 */

import type { Timestamp } from 'firebase/firestore';

import type { AiLabel } from '@/lib/ai-service';
import type { PermissionRequest, PermissionStatus } from '@/lib/permission-service';
import type { Session } from '@/types';

export const STATUS_IZIN: Record<PermissionStatus, string> = {
  pending: 'Menunggu',
  approved: 'Diterima',
  rejected: 'Ditolak',
};

const LABEL_AI: Record<AiLabel, string> = {
  positif: 'Positif',
  netral: 'Netral',
  negatif: 'Negatif',
};

/** "Negatif · keyakinan 69%", atau null bila AI gagal atau tidak mengenali alasannya. */
export function ringkasAi(izin: Pick<PermissionRequest, 'aiLabel' | 'aiConfidence'>): string | null {
  if (!izin.aiLabel) return null;
  const persen = izin.aiConfidence === null ? '' : ` · keyakinan ${Math.round(izin.aiConfidence * 100)}%`;
  return `${LABEL_AI[izin.aiLabel]}${persen}`;
}

export const AI_TIDAK_TERSEDIA = 'Hasil AI tidak tersedia';
export const KETERANGAN_AI = 'Perkiraan nada kalimat dari model sentimen, bukan penilaian alasan.';

/** "Basis Data, Pertemuan 2", atau penanda bila sesinya tidak ada di jadwal. */
export function namaSesi(session: Session | undefined): string {
  if (!session) return 'Sesi tidak ditemukan';
  const [, sesi] = session.title.split(' - ');
  return sesi ? `${session.course}, ${sesi}` : session.course;
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const OFFSET_WIB_MS = 7 * 60 * 60 * 1000;

/** Timestamp menjadi "15 Nov 2026, 14.05 WIB". Dihitung manual agar tidak bergantung Intl di Hermes. */
export function formatWaktuIzin(waktu: Timestamp | null): string {
  if (!waktu) return 'Baru saja';
  const wib = new Date(waktu.toMillis() + OFFSET_WIB_MS);
  const jam = String(wib.getUTCHours()).padStart(2, '0');
  const menit = String(wib.getUTCMinutes()).padStart(2, '0');
  return `${wib.getUTCDate()} ${BULAN[wib.getUTCMonth()]} ${wib.getUTCFullYear()}, ${jam}.${menit} WIB`;
}
