/**
 * laboratory-validation.ts: aturan field laboratorium (PRD 7.3, SRS 6.1).
 * Murni dan tanpa dependensi Firebase, sehingga mudah diuji dan dipakai form.
 */

import {
    isValidLatitude,
    isValidLongitude,
    isValidRadius,
    MAX_RADIUS_METERS,
    MIN_RADIUS_METERS,
} from '@/lib/geo';
import type { CreateLaboratoryInput } from '@/types';

export type LaboratoryField =
    | 'name'
    | 'code'
    | 'building'
    | 'floor'
    | 'room'
    | 'latitude'
    | 'longitude'
    | 'radiusMeters'
    | 'description';

export type LaboratoryFieldErrors = Partial<Record<LaboratoryField, string>>;

export const LABORATORY_LIMITS = {
    name: 80,
    code: 20,
    building: 80,
    floor: 20,
    room: 40,
    description: 200,
} as const;

function checkText(
    errors: LaboratoryFieldErrors,
    field: keyof typeof LABORATORY_LIMITS,
    label: string,
    value: string,
    required: boolean
) {
    const trimmed = value.trim();
    if (required && !trimmed) {
        errors[field] = `${label} wajib diisi.`;
    } else if (trimmed.length > LABORATORY_LIMITS[field]) {
        errors[field] = `${label} maksimal ${LABORATORY_LIMITS[field]} karakter.`;
    }
}

/** Mengembalikan pesan per field; objek kosong berarti input valid. */
export function getLaboratoryFieldErrors(input: CreateLaboratoryInput): LaboratoryFieldErrors {
    const errors: LaboratoryFieldErrors = {};

    checkText(errors, 'name', 'Nama', input.name, true);
    checkText(errors, 'code', 'Kode', input.code, true);
    checkText(errors, 'building', 'Gedung', input.building, true);
    checkText(errors, 'floor', 'Lantai', input.floor, false);
    checkText(errors, 'room', 'Ruang', input.room, true);
    checkText(errors, 'description', 'Deskripsi', input.description, false);

    if (!isValidLatitude(input.latitude)) {
        errors.latitude = 'Latitude harus berupa angka antara -90 dan 90.';
    }
    if (!isValidLongitude(input.longitude)) {
        errors.longitude = 'Longitude harus berupa angka antara -180 dan 180.';
    }
    if (!isValidRadius(input.radiusMeters)) {
        errors.radiusMeters = `Radius harus antara ${MIN_RADIUS_METERS} dan ${MAX_RADIUS_METERS} meter.`;
    }

    return errors;
}

/** Melempar Error berisi pesan field pertama yang gagal; mengembalikan input yang sudah di-trim. */
export function validateLaboratoryInput(input: CreateLaboratoryInput): CreateLaboratoryInput {
    const errors = getLaboratoryFieldErrors(input);
    const first = Object.values(errors)[0];
    if (first) throw new Error(first);

    return {
        name: input.name.trim(),
        code: input.code.trim(),
        building: input.building.trim(),
        floor: input.floor.trim(),
        room: input.room.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
        radiusMeters: input.radiusMeters,
        description: input.description.trim(),
    };
}

/** Mengubah teks form menjadi angka; teks kosong atau tidak valid menjadi NaN. */
export function parseCoordinate(text: string): number {
    const normalized = text.trim().replace(',', '.');
    return normalized === '' ? Number.NaN : Number(normalized);
}
