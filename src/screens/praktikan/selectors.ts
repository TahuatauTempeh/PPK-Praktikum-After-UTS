/**
 * Turunan data dari SessionContext untuk sisi praktikan.
 * Semua fungsi murni, state tetap dimiliki context.
 */

import { formatJamWIB } from '@/screens/praktikan/format';
import { AttendanceRecord, Session } from '@/types';

export function findOwnAttendance(
  attendance: AttendanceRecord[],
  sessionId: string,
  userId: string
): AttendanceRecord | undefined {
  return attendance.find((a) => a.sessionId === sessionId && a.userId === userId);
}

/** Urut naik menurut tanggal lalu jam mulai */
export function urutkanSesi(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

/** "Praktikum Basis Data - Pertemuan 2" menjadi mata kuliah dan nomor sesi */
export function pecahJudul(session: Session) {
  const [, sesi = ''] = session.title.split(' - ');
  return { mataKuliah: session.course, sesi };
}

/** Tanggal sesi yang sedang dibuka, atau tanggal sesi terdekat dengan hari ini bila tidak ada */
export function tanggalAktif(sessions: Session[], hariIni: string): string {
  const dibuka = urutkanSesi(sessions).find((s) => s.status === 'open');
  if (dibuka) return dibuka.date;
  const selisih = (tanggal: string) => Math.abs(Date.parse(tanggal) - Date.parse(hariIni));
  return (
    sessions.reduce<string | null>(
      (terdekat, s) => (terdekat === null || selisih(s.date) < selisih(terdekat) ? s.date : terdekat),
      null
    ) ?? hariIni
  );
}

export type PresensiStatus =
  | 'belum-dibuka'
  | 'bisa-presensi'
  | 'sudah-hadir'
  | 'ditutup-hadir'
  | 'ditutup-tanpa-catatan';

export function presensiStatus(session: Session, record?: AttendanceRecord): PresensiStatus {
  if (record) return session.status === 'closed' ? 'ditutup-hadir' : 'sudah-hadir';
  if (session.status === 'scheduled') return 'belum-dibuka';
  if (session.status === 'open') return 'bisa-presensi';
  return 'ditutup-tanpa-catatan';
}

export interface BarisRiwayat {
  session: Session;
  record?: AttendanceRecord;
  status: PresensiStatus;
}

/**
 * Riwayat satu user: sesi dibuka dan ditutup, terbaru dulu, beserta angkanya.
 * Pembagi persen = sesi ditutup + sesi dibuka yang sudah dihadiri, karena sesi dibuka
 * yang belum dipresensi belum final.
 */
export function ringkasRiwayat(sessions: Session[], attendance: AttendanceRecord[], userId: string) {
  const baris: BarisRiwayat[] = urutkanSesi(sessions)
    .filter((s) => s.status !== 'scheduled')
    .reverse()
    .map((session) => {
      const record = findOwnAttendance(attendance, session.id, userId);
      return { session, record, status: presensiStatus(session, record) };
    });
  const hadir = baris.filter((b) => b.record).length;
  const tidakHadir = baris.filter((b) => !b.record && b.session.status === 'closed').length;
  const pembagi = hadir + tidakHadir;
  const kehadiran = pembagi > 0 ? Math.round((hadir / pembagi) * 100) : null;
  return { baris, hadir, tidakHadir, kehadiran };
}

/** Isi kartu status dan aksi footer untuk tiap kondisi presensi (DESIGN.md bagian 10) */
export function describePresensi(status: PresensiStatus) {
  switch (status) {
    case 'belum-dibuka':
      return {
        aksi: 'nonaktif',
        ringkas: 'Presensi belum dibuka',
        note: 'Presensi dapat diisi setelah asisten membuka sesi.',
      } as const;
    case 'bisa-presensi':
      return {
        aksi: 'presensi',
        ringkas: 'Presensi sedang dibuka',
        note: 'Isi presensi sebelum asisten menutup sesi.',
      } as const;
    case 'sudah-hadir':
      return { aksi: 'riwayat', ringkas: 'Kamu sudah hadir', note: '' } as const;
    case 'ditutup-hadir':
      return { aksi: 'tidak-ada', ringkas: 'Hadir', note: 'Sesi ditutup · hasil akhir' } as const;
    case 'ditutup-tanpa-catatan':
      return {
        aksi: 'tidak-ada',
        ringkas: 'Tidak hadir',
        note: 'Sesi ditutup sebelum presensi kamu tercatat.',
      } as const;
  }
}

/** Pesan galat saat presensi ditolak, diturunkan dari state yang sama dengan yang dipakai reducer */
export function alasanPenolakan(session: Session, record?: AttendanceRecord) {
  if (record) {
    return { pesan: `Presensi kamu sudah tercatat pukul ${formatJamWIB(record.timestamp)} WIB.`, tutup: true };
  }
  if (session.status !== 'open') return { pesan: 'Sesi tidak lagi menerima presensi.', tutup: true };
  return { pesan: 'Presensi belum tercatat. Coba lagi.', tutup: false };
}
