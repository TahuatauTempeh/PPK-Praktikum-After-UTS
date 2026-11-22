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
  expoPushToken?: string | null;
  pushPlatform?: 'android' | 'ios' | null;
  pushUpdatedAt?: Timestamp | null;
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
  /** Kosong berarti laboratorium belum diatur (data lama). */
  laboratoryId: string;
}

/** Catatan kehadiran (presensi) */
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  timestamp: string; // ISO datetime saat presensi tercatat
}

// ─── Sprint 2: Skema Firestore (Data Praktikum - Dev 2) ──────────────────────

/**
 * Representasi waktu yang kompatibel dengan data mock (string/Date)
 * maupun Firestore Timestamp tanpa mengikat tipe ke SDK tertentu.
 */
export type TimestampValue = string | Date | { toDate(): Date };

/** Dokumen pada koleksi `classes/{classId}` */
export interface PracticumClass {
  id: string;
  name: string;
  description: string;
  assistantId: string;
  createdAt: TimestampValue;
}

/** Input untuk membuat kelas baru */
export interface CreateClassInput {
  name: string;
  description: string;
  assistantId: string;
}

/** Input untuk memperbarui kelas */
export interface UpdateClassInput {
  name?: string;
  description?: string;
}

/** Dokumen pada koleksi `enrollments/{enrollmentId}` */
export interface Enrollment {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  enrolledAt: TimestampValue;
}

/** Input untuk menambahkan peserta ke kelas */
export interface CreateEnrollmentInput {
  classId: string;
  userId: string;
  userName: string;
}

/** Dokumen pada koleksi `sessions/{sessionId}` (skema Sprint 2 + Sprint 3) */
export interface PraktikumSession {
  id: string;
  classId: string;
  title: string;
  date: TimestampValue;
  startTime: string; // "08:00"
  endTime: string; // "10:00"
  room: string;
  assistantId: string;
  status: SessionStatus;
  /** Kosong untuk sesi lama yang belum punya laboratorium. */
  laboratoryId: string;
  createdAt: TimestampValue;
}

/** Input untuk membuat sesi praktikum baru */
export interface CreateSessionInput {
  classId: string;
  title: string;
  date: TimestampValue;
  startTime: string;
  endTime: string;
  room: string;
  assistantId: string;
  laboratoryId: string;
}

/** Input untuk memperbarui sesi praktikum */
export interface UpdateSessionInput {
  classId?: string;
  title?: string;
  date?: TimestampValue;
  startTime?: string;
  endTime?: string;
  room?: string;
  laboratoryId?: string;
}

// ─── Sprint 3: Laboratorium & Presensi Lokasi (Dev 1) ───────────────────────

/** Dokumen pada koleksi `laboratories/{labId}` */
export interface Laboratory {
  id: string;
  name: string;
  code: string;
  building: string;
  floor: string;
  room: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // 10 sampai 500
  description: string;
  isActive: boolean;
  createdAt: TimestampValue;
  updatedAt: TimestampValue;
  updatedBy: string; // UID asisten
}

/** Input untuk membuat laboratorium baru */
export interface CreateLaboratoryInput {
  name: string;
  code: string;
  building: string;
  floor: string;
  room: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  description: string;
}

/** Input untuk memperbarui laboratorium */
export interface UpdateLaboratoryInput extends Partial<CreateLaboratoryInput> {
  isActive?: boolean;
}

/** Kode kegagalan presensi berbasis lokasi (klien dan callable) */
export type AttendanceFailureCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_OPEN'
  | 'NOT_ENROLLED'
  | 'LAB_NOT_SET'
  | 'LAB_INACTIVE'
  | 'OUT_OF_RADIUS'
  | 'LOCATION_INACCURATE'
  | 'MOCK_LOCATION'
  | 'ALREADY_PRESENT'
  | 'NETWORK'
  | 'UNKNOWN';

/** Hasil pengiriman presensi ke callable `submitAttendance` */
export type AttendanceSubmitResult =
  | {
      ok: true;
      recordedAt: string;
      distanceMeters: number;
      radiusMeters: number;
    }
  | {
      ok: false;
      code: AttendanceFailureCode;
      message: string;
      distanceMeters?: number;
      radiusMeters?: number;
    };

// ─── Sprint 3: Notifikasi & Perangkat (Dev 4) ───────────────────────────────

/** Status izin dan ketersediaan notifikasi di perangkat */
export type NotificationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unsupported'
  | 'error';

/** Nilai context notifikasi */
export interface NotificationContextValue {
  status: NotificationStatus;
  token: string | null;
  lastError: string | null;
  enableNotifications(): Promise<void>;
  openSettings(): Promise<void>;
  refresh(): Promise<void>;
}

/** Jenis event notifikasi */
export type NotificationEventType =
  | 'session-open'
  | 'session-schedule-changed'
  | 'permission-approved'
  | 'permission-rejected';

/** Payload data dalam push notification */
export interface NotificationPayloadData {
  type: NotificationEventType;
  sessionId?: string;
  permissionId?: string;
  url: string;
}

/** Status proses pengiriman di notificationLogs */
export type NotificationLogStatus =
  | 'processing'
  | 'sent'
  | 'partial'
  | 'failed'
  | 'skipped';

/** Dokumen pada koleksi notificationLogs/{dedupeKey} */
export interface NotificationLog {
  id?: string;
  eventType: NotificationEventType;
  sourceCollection: 'sessions' | 'permissionRequests';
  sourceId: string;
  recipientIds: string[];
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  status: NotificationLogStatus;
  error: string | null;
  createdAt: TimestampValue;
  completedAt: TimestampValue | null;
}
