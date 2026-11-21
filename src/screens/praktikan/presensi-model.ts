/**
 * Model tampilan halaman presensi berbasis lokasi (PRD Sprint 3 bagian 7.1 dan 8.2).
 * Hook presensi mengisi model ini; komponen hanya membaca, tidak mengakses Firebase.
 */

import type { AksiLokasi, Kelayakan, StateKelayakan } from '@/lib/attendance-rules';
import type { SessionStatus } from '@/types';

export interface SesiPresensiTampil {
  id: string;
  judul: string;
  /** Nama kelas, mis. "IF-3A"; null bila belum termuat */
  kelas: string | null;
  /** YYYY-MM-DD */
  tanggal: string;
  /** "08:00 - 09:40" */
  waktu: string;
  ruang: string;
  /** Nama lab, mis. "Lab A201"; null bila sesi belum punya lab */
  laboratorium: string | null;
  asisten: string;
  status: SessionStatus;
}

export interface UkuranLokasi {
  distanceMeters: number | null;
  radiusMeters: number | null;
  accuracyMeters: number | null;
}

/** Presensi yang sudah tercatat, dibaca dari listener */
export interface CatatanPresensi {
  /** "HH.mm" WIB */
  jam: string;
  /** Catatan Sprint 2 tidak punya field lokasi */
  adaBuktiLokasi: boolean;
  distanceMeters: number | null;
}

export type StatusKirim =
  | { tahap: 'diam' }
  | { tahap: 'mengirim' }
  | { tahap: 'berhasil'; jam: string; distanceMeters: number; radiusMeters: number }
  | { tahap: 'gagal'; pesan: string };

export interface PresensiViewModel {
  /** undefined: memuat; null: sesi tidak ditemukan */
  sesi: SesiPresensiTampil | null | undefined;
  /** Pesan bila listener sesi gagal */
  galatMuat: string | null;
  kelayakan: Kelayakan;
  ukuran: UkuranLokasi;
  catatan: CatatanPresensi | null;
  kirim: StatusKirim;
}

export interface PresensiAksi {
  onKembali: () => void;
  onAksiLokasi: (aksi: AksiLokasi) => void;
  /** Dipanggil setelah praktikan mengonfirmasi di sheet */
  onKirim: () => void;
  onMuatUlang: () => void;
  onLihatRiwayat: () => void;
}

/** State yang berasal dari pemeriksaan lokasi, bukan dari data sesi */
const STATE_LOKASI: readonly StateKelayakan[] = [
  'checking-permission',
  'permission-needed',
  'permission-denied',
  'permission-blocked',
  'services-disabled',
  'locating',
  'location-unavailable',
  'mock-location',
  'low-accuracy',
  'out-of-radius',
  'eligible',
];

export function tahapLokasi(state: StateKelayakan): boolean {
  return STATE_LOKASI.includes(state);
}

export function formatMeter(nilai: number): string {
  return `${Math.round(nilai)} m`;
}
