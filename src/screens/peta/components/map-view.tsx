/**
 * Re-ekspor implementasi web untuk resolusi TypeScript.
 * Metro memilih `map-view.native.tsx` di Android/iOS dan `map-view.web.tsx` di web.
 *
 * Ekstensinya harus `.tsx`, sama dengan varian platform. Metro mencoba semua varian `.ts`
 * sebelum `.tsx`, jadi file `map-view.ts` akan terpilih lebih dulu daripada
 * `map-view.native.tsx` dan Android ikut memakai versi web (iframe).
 */

export { PlatformMapView } from './map-view.web';
export type { MapViewProps } from './map-view.types';
