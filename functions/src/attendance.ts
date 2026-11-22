/**
 * Callable `submitAttendance` (Sprint 3).
 * Stub Dev 1: kontrak dan region sudah final, isi diganti Dev 2 (validasi lokasi dan transaksi).
 * Kontrak: PRD 10.3 dan Lampiran C 3.7.
 */

import { HttpsError, onCall } from 'firebase-functions/v2/https';

const REGION = 'asia-southeast2';

export interface SubmitAttendanceRequest {
    sessionId: string;
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    mocked?: boolean;
}

export interface SubmitAttendanceResponse {
    attendanceId: string;
    recordedAt: string; // ISO 8601
    distanceMeters: number;
    radiusMeters: number;
    laboratoryId: string;
    laboratoryName: string;
}

export const submitAttendance = onCall<SubmitAttendanceRequest, Promise<SubmitAttendanceResponse>>(
    { region: REGION, maxInstances: 10 },
    async () => {
        throw new HttpsError('unimplemented', 'Presensi berbasis lokasi belum tersedia.');
    }
);