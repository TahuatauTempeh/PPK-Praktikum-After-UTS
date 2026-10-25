/**
 * Data dummy untuk aplikasi presensi praktikum.
 * Digunakan sebagai initial state di SessionContext.
 */

import { AttendanceRecord, Session, User } from '@/types';

// ─── Daftar User Praktikan ────────────────────────────────────────────────────

export const praktikanUsers: User[] = [
  { id: 'p1', name: 'Ahmad Fauzi', nim: '24060122130001', role: 'praktikan' },
  { id: 'p2', name: 'Budi Santoso', nim: '24060122130002', role: 'praktikan' },
  { id: 'p3', name: 'Citra Dewi', nim: '24060122130003', role: 'praktikan' },
  { id: 'p4', name: 'Dian Permata', nim: '24060122130004', role: 'praktikan' },
  { id: 'p5', name: 'Eko Prasetyo', nim: '24060122130005', role: 'praktikan' },
  { id: 'p6', name: 'Fitri Handayani', nim: '24060122130006', role: 'praktikan' },
  { id: 'p7', name: 'Gilang Ramadhan', nim: '24060122130007', role: 'praktikan' },
  { id: 'p8', name: 'Hana Safira', nim: '24060122130008', role: 'praktikan' },
];

// ─── Daftar User Asisten ──────────────────────────────────────────────────────

export const asistenUsers: User[] = [
  { id: 'a1', name: 'Rizky Maulana', nim: 'AST-001', role: 'asisten' },
  { id: 'a2', name: 'Sari Indah', nim: 'AST-002', role: 'asisten' },
  { id: 'a3', name: 'Teguh Wijaya', nim: 'AST-003', role: 'asisten' },
];

/** Semua user gabungan */
export const allUsers: User[] = [...praktikanUsers, ...asistenUsers];

// ─── Daftar Sesi Praktikum ───────────────────────────────────────────────────

export const dummySessions: Session[] = [
  {
    id: 's1',
    title: 'Praktikum Basis Data - Pertemuan 1',
    course: 'Basis Data',
    date: '2026-10-20',
    time: '08:00 - 10:00',
    room: 'Lab Komputer A',
    assistantId: 'a1',
    status: 'closed',
  },
  {
    id: 's2',
    title: 'Praktikum Basis Data - Pertemuan 2',
    course: 'Basis Data',
    date: '2026-10-27',
    time: '08:00 - 10:00',
    room: 'Lab Komputer A',
    assistantId: 'a1',
    status: 'open',
  },
  {
    id: 's3',
    title: 'Praktikum Pemrograman Web - Pertemuan 1',
    course: 'Pemrograman Web',
    date: '2026-10-21',
    time: '10:00 - 12:00',
    room: 'Lab Komputer B',
    assistantId: 'a2',
    status: 'closed',
  },
  {
    id: 's4',
    title: 'Praktikum Pemrograman Web - Pertemuan 2',
    course: 'Pemrograman Web',
    date: '2026-10-28',
    time: '10:00 - 12:00',
    room: 'Lab Komputer B',
    assistantId: 'a2',
    status: 'scheduled',
  },
  {
    id: 's5',
    title: 'Praktikum Jaringan Komputer - Pertemuan 1',
    course: 'Jaringan Komputer',
    date: '2026-10-22',
    time: '13:00 - 15:00',
    room: 'Lab Jaringan',
    assistantId: 'a3',
    status: 'closed',
  },
  {
    id: 's6',
    title: 'Praktikum Jaringan Komputer - Pertemuan 2',
    course: 'Jaringan Komputer',
    date: '2026-10-29',
    time: '13:00 - 15:00',
    room: 'Lab Jaringan',
    assistantId: 'a3',
    status: 'scheduled',
  },
];

// ─── Data Presensi Awal ──────────────────────────────────────────────────────

export const dummyAttendance: AttendanceRecord[] = [
  // Sesi 1 (closed) — beberapa praktikan sudah hadir
  {
    id: 'att1',
    sessionId: 's1',
    userId: 'p1',
    userName: 'Ahmad Fauzi',
    timestamp: '2026-10-20T08:05:23.000Z',
  },
  {
    id: 'att2',
    sessionId: 's1',
    userId: 'p2',
    userName: 'Budi Santoso',
    timestamp: '2026-10-20T08:07:45.000Z',
  },
  {
    id: 'att3',
    sessionId: 's1',
    userId: 'p3',
    userName: 'Citra Dewi',
    timestamp: '2026-10-20T08:10:12.000Z',
  },
  // Sesi 2 (open) — belum ada yang hadir (untuk testing)
  // Sesi 3 (closed) — beberapa praktikan sudah hadir
  {
    id: 'att4',
    sessionId: 's3',
    userId: 'p1',
    userName: 'Ahmad Fauzi',
    timestamp: '2026-10-21T10:03:30.000Z',
  },
  {
    id: 'att5',
    sessionId: 's3',
    userId: 'p4',
    userName: 'Dian Permata',
    timestamp: '2026-10-21T10:05:15.000Z',
  },
  // Sesi 5 (closed)
  {
    id: 'att6',
    sessionId: 's5',
    userId: 'p2',
    userName: 'Budi Santoso',
    timestamp: '2026-10-22T13:02:00.000Z',
  },
  {
    id: 'att7',
    sessionId: 's5',
    userId: 'p5',
    userName: 'Eko Prasetyo',
    timestamp: '2026-10-22T13:04:30.000Z',
  },
];
