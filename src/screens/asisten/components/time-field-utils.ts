/**
 * Konversi jam "HH:mm" (format Firestore) ke Date untuk picker, dan sebaliknya.
 * Jam dibaca dan ditulis dalam waktu lokal perangkat, sama seperti picker native.
 */

import type { StyleProp, ViewStyle } from 'react-native';

export interface TimeFieldProps {
  /** Jam "HH:mm", 24 jam */
  value: string;
  onChange: (jam: string) => void;
  /** Label pembaca layar, mis. "Jam Mulai" */
  accessibilityLabel: string;
  disabled?: boolean;
  /** Gaya kolom, disamakan dengan input lain di form */
  style?: StyleProp<ViewStyle>;
}

const POLA_JAM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** true bila jam berformat "HH:mm" 24 jam */
export function jamValid(jam: string): boolean {
  return POLA_JAM.test(jam.trim());
}

/** "08:30" menjadi Date pada tanggal `dasar` jam 08.30; jam tidak valid menjadi 08.00 */
export function jamKeDate(jam: string, dasar: Date = new Date()): Date {
  const cocok = POLA_JAM.exec(jam.trim());
  const hasil = new Date(dasar);
  hasil.setHours(cocok ? Number(cocok[1]) : 8, cocok ? Number(cocok[2]) : 0, 0, 0);
  return hasil;
}

/** Date menjadi "HH:mm" */
export function dateKeJam(tanggal: Date): string {
  const jam = String(tanggal.getHours()).padStart(2, '0');
  const menit = String(tanggal.getMinutes()).padStart(2, '0');
  return `${jam}:${menit}`;
}

/** "08:30" menjadi "08.30", sesuai cara aplikasi menampilkan jam */
export function tampilJam(jam: string): string {
  return jam.replace(':', '.');
}
