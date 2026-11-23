import { act, renderHook } from '@testing-library/react-native';
import { AppState, Linking, Platform } from 'react-native';

import {
  getForegroundPermission,
  getFreshPosition,
  hasLocationServicesEnabled,
  requestForegroundPermission,
  watchPosition,
  type DevicePosition,
} from '@/lib/device-location';

import { useMapLocation } from './use-map-location';

const mockFocusCleanups: (() => void)[] = [];

jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    const mockReact = jest.requireActual<typeof import('react')>('react');
    mockReact.useEffect(() => {
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        mockFocusCleanups.push(cleanup);
      }
      return cleanup;
    }, [effect]);
  },
}));

jest.mock('@/lib/device-location', () => ({
  getForegroundPermission: jest.fn(),
  requestForegroundPermission: jest.fn(),
  hasLocationServicesEnabled: jest.fn(),
  getFreshPosition: jest.fn(),
  watchPosition: jest.fn(),
}));

const mockGetPerm = getForegroundPermission as jest.MockedFunction<typeof getForegroundPermission>;
const mockReqPerm = requestForegroundPermission as jest.MockedFunction<
  typeof requestForegroundPermission
>;
const mockHasServices = hasLocationServicesEnabled as jest.MockedFunction<
  typeof hasLocationServicesEnabled
>;
const mockGetFresh = getFreshPosition as jest.MockedFunction<typeof getFreshPosition>;
const mockWatch = watchPosition as jest.MockedFunction<typeof watchPosition>;

const samplePos: DevicePosition = {
  latitude: -7.0519,
  longitude: 110.4383,
  accuracyMeters: 12,
  mocked: false,
  timestamp: 1_700_000_000_000,
};

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useMapLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusCleanups.length = 0;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(() => ({
      remove: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('memulai watchPosition saat izin granted dan GPS aktif, lalu menghentikan saat unmount', async () => {
    const removeWatch = jest.fn();
    mockGetPerm.mockResolvedValue('granted');
    mockHasServices.mockResolvedValue(true);
    mockWatch.mockReturnValue({ remove: removeWatch });
    mockGetFresh.mockResolvedValue({ ok: true, position: samplePos });

    const { result, unmount } = await renderHook(() => useMapLocation(true));
    await flushMicrotasks();

    expect(result.current.permissionStatus).toBe('granted');
    expect(result.current.servicesEnabled).toBe(true);
    expect(result.current.position).toEqual(samplePos);
    expect(mockWatch).toHaveBeenCalledTimes(1);

    await unmount();
    expect(removeWatch).toHaveBeenCalled();
  });

  it('menandai permission denied saat permintaan izin ditolak', async () => {
    mockGetPerm.mockResolvedValue('undetermined');
    mockReqPerm.mockResolvedValue('denied');

    const { result } = await renderHook(() => useMapLocation(true));
    await flushMicrotasks();

    expect(result.current.permissionStatus).toBe('denied');
    expect(result.current.locationError).toBe('PERMISSION_DENIED');
    expect(mockWatch).not.toHaveBeenCalled();
  });

  it('menandai servicesEnabled false saat GPS mati dan mendukung openSettings', async () => {
    const settingsSpy = jest
      .spyOn(Linking, 'openSettings')
      .mockResolvedValue(undefined as never);
    mockGetPerm.mockResolvedValue('granted');
    mockHasServices.mockResolvedValue(false);

    const { result } = await renderHook(() => useMapLocation(true));
    await flushMicrotasks();

    expect(result.current.permissionStatus).toBe('granted');
    expect(result.current.servicesEnabled).toBe(false);
    expect(result.current.locationError).toBe('SERVICES_DISABLED');

    await act(async () => {
      await result.current.openSettings();
    });
    expect(settingsSpy).toHaveBeenCalledTimes(1);
  });

  it('mendukung geolocation browser di Web dan membersihkan clearWatch saat unmount', async () => {
    const originalOS = Platform.OS;
    const originalNav = globalThis.navigator;
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });

    const clearWatch = jest.fn();
    const watchPositionWeb = jest.fn((onSuccess: PositionCallback) => {
      onSuccess({
        coords: {
          latitude: -7.052,
          longitude: 110.438,
          accuracy: 15,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: 1_700_000_000_000,
        toJSON: () => ({}),
      });
      return 42;
    });
    const getCurrentPositionWeb = jest.fn();

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          watchPosition: watchPositionWeb,
          getCurrentPosition: getCurrentPositionWeb,
          clearWatch,
        },
      },
      configurable: true,
    });

    try {
      const { result, unmount } = await renderHook(() => useMapLocation(true));
      await flushMicrotasks();

      expect(result.current.permissionStatus).toBe('granted');
      expect(result.current.position?.latitude).toBe(-7.052);
      expect(result.current.position?.longitude).toBe(110.438);
      expect(watchPositionWeb).toHaveBeenCalledTimes(1);

      await unmount();
      expect(clearWatch).toHaveBeenCalledWith(42);
    } finally {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNav,
        configurable: true,
      });
    }
  });
});
