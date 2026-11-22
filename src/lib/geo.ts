/**
 * geo.ts: fungsi murni untuk jarak dan validasi koordinat laboratorium.
 * Dipakai klien (Dev 2/3). Algoritma yang sama disalin ke functions/src/geo.ts oleh Dev 2.
 */

export const EARTH_RADIUS_M = 6_371_000;
export const MAX_ACCURACY_METERS = 100;
export const MIN_RADIUS_METERS = 10;
export const MAX_RADIUS_METERS = 500;

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/** Jarak lingkaran besar antara dua titik (rumus Haversine), dalam meter. */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);

    const h =
        Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Titik dianggap di dalam radius bila jaraknya sama dengan atau kurang dari radius. */
export function isWithinRadius(distanceMeters: number, radiusMeters: number): boolean {
    return (
        Number.isFinite(distanceMeters) &&
        Number.isFinite(radiusMeters) &&
        distanceMeters >= 0 &&
        distanceMeters <= radiusMeters
    );
}

export function isValidLatitude(value: number): boolean {
    return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
    return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidRadius(value: number): boolean {
    return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= MIN_RADIUS_METERS &&
        value <= MAX_RADIUS_METERS
    );
}

/** Format jarak untuk UI: "85 m" di bawah 1 km, "1,2 km" di atasnya. */
export function formatDistanceMeters(value: number): string {
    if (!Number.isFinite(value) || value < 0) return '-';
    if (value < 1000) return `${Math.round(value)} m`;
    return `${(value / 1000).toFixed(1).replace('.', ',')} km`;
}