/**
 * use-map-location.ts: mengelola izin lokasi foreground, status layanan GPS,
 * dan pemantauan posisi pengguna hanya selama layar peta aktif/fokus.
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

export function useMapLocation(enabled: boolean = true): MapLocationState {
  const isWeb = Platform.OS === 'web';

  const [permissionStatus, setPermissionStatus] = useState<MapPermissionState>(() =>
    isWeb || !enabled ? 'denied' : 'checking'
  );
  const [servicesEnabled, setServicesEnabled] = useState(!isWeb);
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

  const syncLocation = useCallback(
    async (allowPrompt: boolean) => {
      if (isWeb || !enabled || !mountedRef.current || !isFocusedRef.current) return;

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
    [enabled, isWeb, stopWatch, updatePermissionState]
  );

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      mountedRef.current = true;
      if (!isWeb && enabled) {
        void syncLocation(true);
      }
      return () => {
        isFocusedRef.current = false;
        stopWatch();
      };
    }, [enabled, isWeb, stopWatch, syncLocation])
  );

  useEffect(() => {
    mountedRef.current = true;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isFocusedRef.current && !isWeb && enabled) {
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
  }, [enabled, isWeb, stopWatch, syncLocation]);

  const requestPermission = useCallback(async () => {
    if (isWeb || !enabled) return;
    const requested = await requestForegroundPermission();
    if (!mountedRef.current) return;
    if (requested === 'granted') {
      updatePermissionState('granted');
      await syncLocation(false);
      return;
    }
    updatePermissionState(requested);
    setPosition(null);
    setLocationError(requested === 'blocked' ? 'PERMISSION_BLOCKED' : 'PERMISSION_DENIED');
  }, [enabled, isWeb, syncLocation, updatePermissionState]);

  const refreshLocation = useCallback(async () => {
    if (isWeb || !enabled) return;
    await syncLocation(false);
  }, [enabled, isWeb, syncLocation]);

  const openSettings = useCallback(async () => {
    await Linking.openSettings();
  }, []);

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
