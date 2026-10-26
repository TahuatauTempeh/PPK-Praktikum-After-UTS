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

/** Sesi dibuka paling atas, lalu yang akan datang (terdekat dulu), lalu yang selesai (terbaru dulu) */
export function urutkanSesi(sessions: Session[]): Session[] {
  const menurut = (status: Session['status']) => sessions.filter((s) => s.status === status);
  return [
    ...menurut('open').sort((a, b) => a.date.localeCompare(b.date)),
    ...menurut('scheduled').sort((a, b) => a.date.localeCompare(b.date)),
    ...menurut('closed').sort((a, b) => b.date.localeCompare(a.date)),
  ];
}

export interface RiwayatItem {
  session: Session;
  record: AttendanceRecord;
}

/** Catatan milik satu user beserta sesinya, sesi terbaru lebih dulu */
export function ownHistory(
  sessions: Session[],
  attendance: AttendanceRecord[],
  userId: string | undefined
): RiwayatItem[] {
  if (!userId) return [];
  return attendance
    .filter((a) => a.userId === userId)
    .flatMap((record) => {
      const session = sessions.find((s) => s.id === record.sessionId);
      return session ? [{ session, record }] : [];
    })
    .sort((a, b) => b.session.date.localeCompare(a.session.date));
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

/** Teks tombol dan alasan untuk tiap kondisi, supaya tombol nonaktif selalu punya penjelasan */
export function describePresensi(status: PresensiStatus, record?: AttendanceRecord) {
  const jam = record ? formatJamWIB(record.timestamp) : '';
  switch (status) {
    case 'belum-dibuka':
      return {
        enabled: false,
        buttonLabel: 'Presensi belum tersedia',
        ringkas: 'Belum dibuka',
        note: 'Sesi belum dibuka oleh asisten.',
      };
    case 'bisa-presensi':
      return {
        enabled: true,
        buttonLabel: 'Presensi sekarang',
        ringkas: 'Belum presensi',
        note: 'Sesi sedang dibuka. Kehadiranmu dicatat sesuai waktu saat kamu mengonfirmasi.',
      };
    case 'sudah-hadir':
      return {
        enabled: false,
        buttonLabel: 'Sudah presensi',
        ringkas: 'Hadir',
        note: `Kamu sudah presensi pukul ${jam} WIB.`,
      };
    case 'ditutup-hadir':
      return {
        enabled: false,
        buttonLabel: 'Sudah presensi',
        ringkas: 'Hadir',
        note: `Sesi sudah ditutup. Kamu hadir pukul ${jam} WIB.`,
      };
    case 'ditutup-tanpa-catatan':
      return {
        enabled: false,
        buttonLabel: 'Sesi sudah ditutup',
        ringkas: 'Tidak ada catatan',
        note: 'Sesi sudah ditutup dan tidak ada catatan kehadiran untukmu.',
      };
  }
}
