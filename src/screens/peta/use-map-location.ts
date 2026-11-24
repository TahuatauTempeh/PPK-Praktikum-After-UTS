/**
 * use-map-location.ts: mengelola izin lokasi foreground, status layanan GPS,
 * dan pemantauan posisi pengguna hanya selama layar peta aktif/fokus
 * (baik di Android/iOS lewat expo-location maupun di Web lewat Geolocation API).
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import {
  getForegroundPermission,
  getFreshPosition,
  hasLocationServicesEnabled,
  requestForegroundPermission,
  watchPosition,
  type DeviceLocationFailureCode,
  type DevicePosition,
} from '@/lib/device-location';

export type MapPermissionState = 'checking' | 'granted' | 'denied' | 'blocked';

export interface MapLocationState {
  permissionStatus: MapPermissionState;
  servicesEnabled: boolean;
  position: DevicePosition | null;
  locationError: DeviceLocationFailureCode | null;
  requestPermission: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  openSettings: () => Promise<void>;
}

const WEB_GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 5_000,
};

function toWebDevicePosition(pos: GeolocationPosition): DevicePosition {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracyMeters:
      typeof pos.coords.accuracy === 'number' && Number.isFinite(pos.coords.accuracy)
        ? pos.coords.accuracy
        : 25,
    mocked: false,
    timestamp: pos.timestamp,
  };
}

function mapWebGeoError(err: GeolocationPositionError): {
  permission: MapPermissionState;
  code: DeviceLocationFailureCode;
} {
  if (err.code === 1) {
    return { permission: 'blocked', code: 'PERMISSION_BLOCKED' };
  }
  if (err.code === 3) {
    return { permission: 'granted', code: 'TIMEOUT' };
  }
  return { permission: 'granted', code: 'UNAVAILABLE' };
}

async function queryWebGeolocationPermission(): Promise<PermissionState | null> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return null;
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return null;
  }
}

export function useMapLocation(enabled: boolean = true): MapLocationState {
  const isWeb = Platform.OS === 'web';

  const [permissionStatus, setPermissionStatus] = useState<MapPermissionState>(() =>
    !enabled ? 'denied' : 'checking'
  );
  const [servicesEnabled, setServicesEnabled] = useState(true);
  const [position, setPosition] = useState<DevicePosition | null>(null);
  const [locationError, setLocationError] = useState<DeviceLocationFailureCode | null>(null);

  const hasAutoRequestedRef = useRef(false);
  const permissionRef = useRef<MapPermissionState>(permissionStatus);
  const watchRef = useRef<{ remove(): void } | null>(null);
  const isFocusedRef = useRef(false);
  const mountedRef = useRef(true);

  const updatePermissionState = useCallback((next: MapPermissionState) => {
    permissionRef.current = next;
    setPermissionStatus(next);
  }, []);

  const stopWatch = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  const syncWebLocation = useCallback(
    async (allowPrompt: boolean, forcePrompt: boolean = false) => {
      if (!enabled || !mountedRef.current || !isFocusedRef.current) return;

      stopWatch();

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        updatePermissionState('blocked');
        setServicesEnabled(false);
        setPosition(null);
        setLocationError('UNAVAILABLE');
        return;
      }

      const browserPerm = await queryWebGeolocationPermission();
      if (!mountedRef.current || !isFocusedRef.current) return;

      if (browserPerm === 'denied') {
        updatePermissionState('blocked');
        setServicesEnabled(true);
        setPosition(null);
        setLocationError('PERMISSION_BLOCKED');
        return;
      }

      if (browserPerm === 'prompt' && !forcePrompt) {
        if (!allowPrompt || hasAutoRequestedRef.current) {
          updatePermissionState('denied');
          setServicesEnabled(true);
          setPosition(null);
          setLocationError('PERMISSION_DENIED');
          return;
        }
        hasAutoRequestedRef.current = true;
      } else if (browserPerm === null && !forcePrompt && allowPrompt) {
        if (hasAutoRequestedRef.current) {
          updatePermissionState('denied');
          setServicesEnabled(true);
          setPosition(null);
          setLocationError('PERMISSION_DENIED');
          return;
        }
        hasAutoRequestedRef.current = true;
      }

      const geo = navigator.geolocation;
      const onSuccess = (pos: GeolocationPosition) => {
        if (!mountedRef.current || !isFocusedRef.current) return;
        updatePermissionState('granted');
        setServicesEnabled(true);
        setPosition(toWebDevicePosition(pos));
        setLocationError(null);
      };
      const onError = (err: GeolocationPositionError) => {
        if (!mountedRef.current || !isFocusedRef.current) return;
        const mapped = mapWebGeoError(err);
        updatePermissionState(mapped.permission);
        setServicesEnabled(true);
        if (mapped.permission !== 'granted') {
          setPosition(null);
          stopWatch();
        }
        setLocationError(mapped.code);
      };

      const watchId = geo.watchPosition(onSuccess, onError, WEB_GEO_OPTIONS);
      watchRef.current = {
        remove() {
          geo.clearWatch(watchId);
        },
      };
      geo.getCurrentPosition(onSuccess, onError, WEB_GEO_OPTIONS);
    },
    [enabled, stopWatch, updatePermissionState]
  );

  const syncNativeLocation = useCallback(
    async (allowPrompt: boolean) => {
      if (!enabled || !mountedRef.current || !isFocusedRef.current) return;

      stopWatch();

      let currentPerm = await getForegroundPermission();
      if (!mountedRef.current || !isFocusedRef.current) return;

      if (currentPerm === 'undetermined') {
        if (allowPrompt && !hasAutoRequestedRef.current) {
          hasAutoRequestedRef.current = true;
          const requested = await requestForegroundPermission();
          if (!mountedRef.current || !isFocusedRef.current) return;
          if (requested !== 'granted') {
            updatePermissionState(requested);
            setPosition(null);
            setLocationError(requested === 'blocked' ? 'PERMISSION_BLOCKED' : 'PERMISSION_DENIED');
            return;
          }
          currentPerm = 'granted';
        } else {
          updatePermissionState('denied');
          setPosition(null);
          setLocationError('PERMISSION_DENIED');
          return;
        }
      }

      if (currentPerm !== 'granted') {
        const nextStatus: MapPermissionState =
          permissionRef.current === 'blocked' ? 'blocked' : 'denied';
        updatePermissionState(nextStatus);
        setPosition(null);
        setLocationError(
          nextStatus === 'blocked' ? 'PERMISSION_BLOCKED' : 'PERMISSION_DENIED'
        );
        return;
      }

      updatePermissionState('granted');

      const gpsOn = await hasLocationServicesEnabled();
      if (!mountedRef.current || !isFocusedRef.current) return;

      if (!gpsOn) {
        setServicesEnabled(false);
        setPosition(null);
        setLocationError('SERVICES_DISABLED');
        return;
      }

      setServicesEnabled(true);
      setLocationError(null);

      watchRef.current = watchPosition(
        (nextPos) => {
          if (!mountedRef.current || !isFocusedRef.current) return;
          setPosition(nextPos);
          setLocationError(null);
        },
        (code) => {
          if (!mountedRef.current || !isFocusedRef.current) return;
          if (code === 'SERVICES_DISABLED') setServicesEnabled(false);
          setLocationError(code);
        }
      );

      const fresh = await getFreshPosition({ timeoutMs: 10_000 });
      if (!mountedRef.current || !isFocusedRef.current) return;
      if (fresh.ok) {
        setPosition(fresh.position);
        setLocationError(null);
      } else {
        if (fresh.code === 'SERVICES_DISABLED') setServicesEnabled(false);
        setLocationError((prev) => prev ?? fresh.code);
      }
    },
    [enabled, stopWatch, updatePermissionState]
  );

  const syncLocation = useCallback(
    async (allowPrompt: boolean, forcePrompt: boolean = false) => {
      if (isWeb) {
        await syncWebLocation(allowPrompt, forcePrompt);
      } else {
        await syncNativeLocation(allowPrompt);
      }
    },
    [isWeb, syncNativeLocation, syncWebLocation]
  );

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      mountedRef.current = true;
      if (enabled) {
        void syncLocation(true);
      }
      return () => {
        isFocusedRef.current = false;
        stopWatch();
      };
    }, [enabled, stopWatch, syncLocation])
  );

  useEffect(() => {
    mountedRef.current = true;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isFocusedRef.current && enabled) {
        void syncLocation(false);
      } else if (nextState !== 'active') {
        stopWatch();
      }
    });
    return () => {
      mountedRef.current = false;
      subscription.remove();
      stopWatch();
    };
  }, [enabled, stopWatch, syncLocation]);

  const requestPermission = useCallback(async () => {
    if (!enabled) return;
    if (isWeb) {
      await syncWebLocation(true, true);
      return;
    }
    const requested = await requestForegroundPermission();
    if (!mountedRef.current) return;
    if (requested === 'granted') {
      updatePermissionState('granted');
      await syncNativeLocation(false);
      return;
    }
    updatePermissionState(requested);
    setPosition(null);
    setLocationError(requested === 'blocked' ? 'PERMISSION_BLOCKED' : 'PERMISSION_DENIED');
  }, [enabled, isWeb, syncNativeLocation, syncWebLocation, updatePermissionState]);

  const refreshLocation = useCallback(async () => {
    if (!enabled) return;
    await syncLocation(false, isWeb);
  }, [enabled, isWeb, syncLocation]);

  const openSettings = useCallback(async () => {
    if (isWeb) return;
    await Linking.openSettings();
  }, [isWeb]);

  return {
    permissionStatus,
    servicesEnabled,
    position,
    locationError,
    requestPermission,
    refreshLocation,
    openSettings,
  };
}
