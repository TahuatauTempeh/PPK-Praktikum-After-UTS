/**
 * Konversi tanggal "YYYY-MM-DD" (format Firestore) ke Date untuk picker, dan sebaliknya.
 * Tanggal dibaca sebagai hari kalender lokal, sama seperti picker native.
 */

import type { StyleProp, ViewStyle } from 'react-native';

export interface DateFieldProps {
  /** Tanggal "YYYY-MM-DD" */
  value: string;
  onChange: (tanggal: string) => void;
  /** Label pembaca layar, mis. "Tanggal Sesi" */
  accessibilityLabel: string;
  disabled?: boolean;
  /** Gaya kolom, disamakan dengan input lain di form */
  style?: StyleProp<ViewStyle>;
}

const POLA_TANGGAL = /^(\d{4})-(\d{2})-(\d{2})$/;

function bagian(tanggal: string): [number, number, number] | null {
  const cocok = POLA_TANGGAL.exec(tanggal.trim());
  if (!cocok) return null;
  const [tahun, bulan, hari] = [Number(cocok[1]), Number(cocok[2]), Number(cocok[3])];
  const cek = new Date(Date.UTC(tahun, bulan - 1, hari));
  const sah = cek.getUTCFullYear() === tahun && cek.getUTCMonth() === bulan - 1 && cek.getUTCDate() === hari;
  return sah ? [tahun, bulan, hari] : null;
}

/** true bila tanggal berformat "YYYY-MM-DD" dan ada di kalender (bukan 30 Februari) */
export function tanggalValid(tanggal: string): boolean {
  return bagian(tanggal) !== null;
}

/**
 * "2026-11-23" menjadi Date lokal tanggal itu pukul 12.00. Tengah hari menghindari
 * pergeseran hari karena zona waktu. Tanggal tidak valid memakai `cadangan`.
 */
export function tanggalKeDate(tanggal: string, cadangan: Date = new Date()): Date {
  const hasil = bagian(tanggal);
  if (!hasil) return new Date(cadangan.getFullYear(), cadangan.getMonth(), cadangan.getDate(), 12);
  return new Date(hasil[0], hasil[1] - 1, hasil[2], 12);
}

/** Date menjadi "YYYY-MM-DD" menurut kalender lokal */
export function dateKeTanggal(tanggal: Date): string {
  const tahun = tanggal.getFullYear();
  const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
  const hari = String(tanggal.getDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${hari}`;
}
