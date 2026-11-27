/**
 * Teks tampilan izin yang dipakai sisi Praktikan dan Asisten, supaya istilahnya sama di kedua sisi.
 */

import type { Timestamp } from 'firebase/firestore';

import type { PermissionStatus } from '@/lib/permission-service';
import type { Session } from '@/types';

export const STATUS_IZIN: Record<PermissionStatus, string> = {
  pending: 'Menunggu',
  approved: 'Diterima',
  rejected: 'Ditolak',
};

export type KeadaanSesi = 'memuat' | 'siap' | 'galat';

const SESI_KOSONG: Record<KeadaanSesi, string> = {
  memuat: 'Memuat sesi...',
  siap: 'Sesi tidak ditemukan',
  galat: 'Sesi gagal dimuat',
};

/**
 * "Basis Data, Pertemuan 3: JOIN & Subquery": nama kelas lalu judul sesi dari Firestore.
 * Bila sesinya belum ada, keadaan daftar sesi menentukan penandanya.
 */
export function namaSesi(session: Session | undefined, keadaan: KeadaanSesi = 'siap'): string {
  if (!session) return SESI_KOSONG[keadaan];
  const judul = session.title.trim();
  return judul && judul !== session.course ? `${session.course}, ${judul}` : session.course;
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
