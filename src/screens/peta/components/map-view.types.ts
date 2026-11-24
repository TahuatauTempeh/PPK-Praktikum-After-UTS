/**
 * map-view.types.ts: kontrak props bersama antara implementasi peta
 * native (Android/iOS) dan fallback web.
 */

import type { DevicePosition } from '@/lib/device-location';

import type { LaboratoryMapItem } from '../selectors';

export interface MapViewProps {
  items: LaboratoryMapItem[];
  selectedLabId: string | null;
  onSelectLab: (labId: string | null) => void;
  userPosition: DevicePosition | null;
  bottomInset?: number;
  banner?: React.ReactNode;
  onMapError?: () => void;
  onCenterRequest?: () => void;
}
