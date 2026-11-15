/**
 * Tipe data inti aplikasi presensi praktikum.
 * Digunakan oleh semua programmer.
 */

import type { Timestamp } from 'firebase/firestore';

/** Peran pengguna dalam aplikasi */
export type Role = 'praktikan' | 'asisten';

/** Status sesi praktikum */
export type SessionStatus = 'scheduled' | 'open' | 'closed';

/** Data pengguna */
export interface User {
  id: string;
  name: string;
  nim: string; // NIM untuk praktikan, kode/NIP untuk asisten
  role: Role;
}

/** Profil lengkap pengguna di koleksi `users` */
export interface UserProfile extends User {
  email: string;
  isAdmin: boolean;
  roleUpdatedBy?: string;
  roleUpdatedAt?: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/** Input form registrasi praktikan */
export interface RegisterInput {
  name: string;
  nim: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Catatan audit perubahan data */
export interface AuditLog {
  id: string;
  action: string;
  collection: string;
  docId: string;
  actorUid: string;
  actorRole: Role | null;
  before: unknown | null;
  after: unknown | null;
  timestamp: Timestamp | null;
}

/** Data sesi praktikum */
export interface Session {
  id: string;
  title: string; // e.g. "Praktikum Basis Data - Pertemuan 3"
  course: string; // e.g. "Basis Data"
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // e.g. "08:00 - 10:00"
  room: string; // e.g. "Lab Komputer A"
  assistantId: string; // ID asisten penanggung jawab
  status: SessionStatus;
}

/** Catatan kehadiran (presensi) */
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  timestamp: string; // ISO datetime saat presensi tercatat
}
