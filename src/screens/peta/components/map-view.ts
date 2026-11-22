/**
 * Re-ekspor implementasi web untuk resolusi TypeScript.
 * Metro memilih `map-view.native.tsx` di Android/iOS dan `map-view.web.tsx` di web.
 */

export { PlatformMapView } from './map-view.web';
export type { MapViewProps } from './map-view.types';
