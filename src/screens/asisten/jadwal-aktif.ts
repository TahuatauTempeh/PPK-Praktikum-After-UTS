/**
 * Data untuk layar Jadwal asisten dari sesi Firestore.
 *
 * Layar Jadwal menampilkan sesi pada satu tanggal. Tanggal itu dulu diambil dari sesi
 * pertama di hasil listener (urutannya acak), sehingga sesi hari ini bisa tidak muncul.
 */

import type { FirestoreSession } from '@/lib/session-actions';

import type { AssistantSession } from './schedule-data';

const OFFSET_WIB_MS = 7 * 60 * 60 * 1000;

/** Tanggal hari ini menurut WIB, format YYYY-MM-DD */
export function tanggalHariIniWIB(sekarang: Date = new Date()): string {
  return new Date(sekarang.getTime() + OFFSET_WIB_MS).toISOString().slice(0, 10);
}

/**
 * Hari ini bila ada sesi hari ini; bila tidak, tanggal sesi terdekat berikutnya;
 * bila tidak ada juga, tanggal sesi terakhir. null bila belum ada sesi.
 */
export function pilihTanggalAktif(tanggalSesi: readonly string[], hariIni: string): string | null {
  const urut = [...new Set(tanggalSesi.filter(Boolean))].sort();
  if (urut.length === 0) return null;
  if (urut.includes(hariIni)) return hariIni;
  return urut.find((tanggal) => tanggal > hariIni) ?? urut[urut.length - 1];
}

/**
 * Bentuk sesi untuk kartu Jadwal. Kartu menulis judul sebagai `${course} ${code}`,
 * jadi `course` berisi nama kelas dan `code` dikosongkan; judul sesi masuk `topic`.
 */
export function keSesiAsisten(sesi: FirestoreSession, namaKelas: ReadonlyMap<string, string>): AssistantSession {
  const kelas = namaKelas.get(sesi.classId);
  return {
    id: sesi.id,
    code: '',
    course: kelas ?? sesi.title,
    topic: sesi.title,
    className: kelas ?? 'Kelas Praktikum',
    date: sesi.date,
    startTime: sesi.startTime,
    endTime: sesi.endTime,
    room: sesi.room,
    status: sesi.status === 'scheduled' ? 'pending' : sesi.status,
    participantIds: [],
  };
}
