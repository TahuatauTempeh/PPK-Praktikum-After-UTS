/**
 * device-location.ts: izin dan posisi perangkat (hanya foreground).
 * Dipakai Dev 2 (presensi) dan Dev 3 (peta). Tidak ada import dari layar.
 */

import * as Location from 'expo-location';

export type DeviceLocationFailureCode =
    | 'PERMISSION_DENIED'
    | 'PERMISSION_BLOCKED'
    | 'SERVICES_DISABLED'
    | 'TIMEOUT'
    | 'UNAVAILABLE';

export interface DevicePosition {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    mocked: boolean;
    timestamp: number;
}

export type DeviceLocationResult =
    | { ok: true; position: DevicePosition }
    | { ok: false; code: DeviceLocationFailureCode; message: string };

export const DEFAULT_LOCATION_TIMEOUT_MS = 15_000;

export const LOCATION_MESSAGES: Record<DeviceLocationFailureCode, string> = {
    PERMISSION_DENIED: 'Izin lokasi diperlukan.',
    PERMISSION_BLOCKED: 'Izin lokasi diblokir. Aktifkan lewat pengaturan perangkat.',
    SERVICES_DISABLED: 'Layanan lokasi nonaktif. Aktifkan GPS lalu coba lagi.',
    TIMEOUT: 'Lokasi belum tersedia. Coba lagi.',
    UNAVAILABLE: 'Lokasi tidak tersedia di perangkat ini.',
};

function toDevicePosition(location: Location.LocationObject): DevicePosition {
    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracyMeters: location.coords.accuracy ?? Number.POSITIVE_INFINITY,
        mocked: location.mocked === true,
        timestamp: location.timestamp,
    };
}

function failure(code: DeviceLocationFailureCode): DeviceLocationResult {
    return { ok: false, code, message: LOCATION_MESSAGES[code] };
}

export async function getForegroundPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
        const response = await Location.getForegroundPermissionsAsync();
        if (response.granted) return 'granted';
        return response.status === Location.PermissionStatus.UNDETERMINED ? 'undetermined' : 'denied';
    } catch {
        return 'denied';
    }
}

export async function requestForegroundPermission(): Promise<'granted' | 'denied' | 'blocked'> {
    try {
        const response = await Location.requestForegroundPermissionsAsync();
        if (response.granted) return 'granted';
        return response.canAskAgain === false ? 'blocked' : 'denied';
    } catch {
        return 'denied';
    }
}

export async function hasLocationServicesEnabled(): Promise<boolean> {
    try {
        return await Location.hasServicesEnabledAsync();
    } catch {
        return false;
    }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | 'timeout'> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve('timeout'), timeoutMs);
        promise.then(
            value => {
                clearTimeout(timer);
                resolve(value);
            },
            error => {
                clearTimeout(timer);
                reject(error);
            }
        );
    });
}

/**
 * Membaca satu posisi segar. Izin diperiksa lebih dulu (fungsi ini tidak meminta izin;
 * pemanggil memakai requestForegroundPermission), lalu layanan lokasi, lalu posisi
 * dengan batas waktu `timeoutMs`.
 *
 * `maxAccuracyMeters` dicadangkan untuk pemanggil: posisi dengan akurasi buruk tetap
 * dikembalikan apa adanya, dan keputusan akurasi (MAX_ACCURACY_METERS) diambil oleh
 * halaman presensi serta divalidasi ulang di server.
 */
export async function getFreshPosition(options?: {
    timeoutMs?: number;
    maxAccuracyMeters?: number;
}): Promise<DeviceLocationResult> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_LOCATION_TIMEOUT_MS;

    try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
            if (permission.status === Location.PermissionStatus.UNDETERMINED) {
                return failure('PERMISSION_DENIED');
            }
            return failure(permission.canAskAgain === false ? 'PERMISSION_BLOCKED' : 'PERMISSION_DENIED');
        }
    } catch {
        return failure('UNAVAILABLE');
    }

    if (!(await hasLocationServicesEnabled())) return failure('SERVICES_DISABLED');

    try {
        const result = await withTimeout(
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
            timeoutMs
        );
        if (result === 'timeout') return failure('TIMEOUT');
        return { ok: true, position: toDevicePosition(result) };
    } catch {
        return failure('UNAVAILABLE');
    }
}

/**
 * Memantau posisi selama layar aktif. `remove()` menghentikan pemantauan,
 * termasuk bila dipanggil sebelum langganan selesai dibuat.
 */
export function watchPosition(
    onPosition: (position: DevicePosition) => void,
    onError: (code: DeviceLocationFailureCode, message: string) => void
): { remove(): void } {
    let removed = false;
    let subscription: Location.LocationSubscription | null = null;

    const fail = (code: DeviceLocationFailureCode) => {
        if (!removed) onError(code, LOCATION_MESSAGES[code]);
    };

    void (async () => {
        let permission: Location.LocationPermissionResponse;
        try {
            permission = await Location.getForegroundPermissionsAsync();
        } catch {
            fail('UNAVAILABLE');
            return;
        }
        if (removed) return;
        if (!permission.granted) {
            if (permission.status === Location.PermissionStatus.UNDETERMINED) {
                fail('PERMISSION_DENIED');
            } else {
                fail(permission.canAskAgain === false ? 'PERMISSION_BLOCKED' : 'PERMISSION_DENIED');
            }
            return;
        }
        if (!(await hasLocationServicesEnabled())) {
            fail('SERVICES_DISABLED');
            return;
        }
        try {
            const created = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
                location => {
                    if (!removed) onPosition(toDevicePosition(location));
                },
                () => fail('UNAVAILABLE')
            );
            if (removed) created.remove();
            else subscription = created;
        } catch {
            fail('UNAVAILABLE');
        }
    })();

    return {
        remove() {
            removed = true;
            subscription?.remove();
            subscription = null;
        },
    };
}
