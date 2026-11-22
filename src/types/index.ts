/**
 * Kontrak tipe bersama aplikasi Presensi Praktikum (NFR-MAINT-02).
 * Semua layar, service, dan context mengimpor tipe dari '@/types'.
 *
 * Jangan mengimpor dari '@/types' di dalam file ini (menyebabkan circular import).
 */

import type { Timestamp } from 'firebase/firestore';

// ─── Umum ────────────────────────────────────────────────────────────────────

/** Nilai waktu dari Firestore (Timestamp), Date, atau string ISO / YYYY-MM-DD. */
export type TimestampValue = Timestamp | Date | string;

export type Role = 'praktikan' | 'asisten';

export type SessionStatus = 'scheduled' | 'open' | 'closed';

// ─── Pengguna ────────────────────────────────────────────────────────────────

/** Bentuk ringkas pengguna yang dipakai komponen UI dan data dummy. */
export interface User {
    id: string;
    name: string;
    nim: string;
    role: Role;
}

/** Dokumen `users/{uid}`. */
export interface UserProfile {
    id: string;
    name: string;
    nim: string;
    email: string;
    role: Role;
    isAdmin: boolean;
    roleUpdatedBy?: string;
    roleUpdatedAt?: TimestampValue | null;
    createdAt?: TimestampValue | null;
    updatedAt?: TimestampValue | null;
    expoPushToken?: string | null;
    pushPlatform?: 'android' | 'ios' | null;
    pushUpdatedAt?: TimestampValue | null;
}

export interface RegisterInput {
    name: string;
    nim: string;
    email: string;
    password: string;
    confirmPassword: string;
}

// ─── Kelas dan peserta ───────────────────────────────────────────────────────

export interface PracticumClass {
    id: string;
    name: string;
    description: string;
    assistantId: string;
    createdAt: TimestampValue;
}

export interface CreateClassInput {
    name: string;
    description: string;
    assistantId: string;
}

export type UpdateClassInput = Partial<Pick<CreateClassInput, 'name' | 'description'>>;

export interface Enrollment {
    /** `{classId}_{uid}` */
    id: string;
    classId: string;
    userId: string;
    userName: string;
    enrolledAt: TimestampValue;
}

export interface CreateEnrollmentInput {
    classId: string;
    userId: string;
    userName: string;
}

// ─── Sesi ────────────────────────────────────────────────────────────────────

/** Dokumen `sessions/{id}` (skema Sprint 2 + `laboratoryId` Sprint 3). */
export interface PraktikumSession {
    id: string;
    classId: string;
    title: string;
    /** YYYY-MM-DD (WIB). */
    date: string;
    /** HH:mm */
    startTime: string;
    /** HH:mm */
    endTime: string;
    room: string;
    assistantId: string;
    status: SessionStatus;
    /** Kosong untuk sesi lama yang belum punya laboratorium. */
    laboratoryId: string;
    createdAt: TimestampValue;
}

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

export type UpdateSessionInput = Partial<Omit<CreateSessionInput, 'assistantId'>>;

/** Bentuk sesi untuk komponen UI praktikan (hasil `toPraktikanSession`) dan data dummy. */
export interface Session {
    id: string;
    title: string;
    course: string;
    date: string;
    /** "08:00 - 10:00" */
    time: string;
    room: string;
    assistantId: string;
    status: SessionStatus;
}

// ─── Presensi ────────────────────────────────────────────────────────────────

/** Catatan presensi untuk state SessionContext dan data dummy. */
export interface AttendanceRecord {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    /** ISO 8601 */
    timestamp: string;
}

// ─── Laboratorium (PRD 10.1) ─────────────────────────────────────────────────

export interface Laboratory {
    id: string;
    name: string;
    code: string;
    building: string;
    floor: string;
    room: string;
    latitude: number;
    longitude: number;
    /** 10 sampai 500. */
    radiusMeters: number;
    description: string;
    isActive: boolean;
    createdAt: TimestampValue;
    updatedAt: TimestampValue;
    /** UID asisten. */
    updatedBy: string;
}

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

export type UpdateLaboratoryInput = Partial<CreateLaboratoryInput> & {
    isActive?: boolean;
};

// ─── Notifikasi ──────────────────────────────────────────────────────────────

export type NotificationStatus =
    | 'idle'
    | 'requesting'
    | 'granted'
    | 'denied'
    | 'blocked'
    | 'unsupported'
    | 'error';

export interface NotificationContextValue {
    status: NotificationStatus;
    token: string | null;
    lastError: string | null;
    enableNotifications: () => Promise<void>;
    openSettings: () => Promise<void>;
    refresh: () => Promise<void>;
}