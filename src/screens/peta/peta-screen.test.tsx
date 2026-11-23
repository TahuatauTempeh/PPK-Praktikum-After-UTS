import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { PetaScreen } from './peta-screen';
import type { LaboratoryMapItem } from './selectors';
import { useMapData } from './use-map-data';
import { useMapLocation } from './use-map-location';

let lastWebViewOnMessage: ((event: { nativeEvent: { data: string } }) => void) | undefined;

jest.mock('react-native-webview', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockWebView = mockReact.forwardRef(
    ({ onMessage, ...rest }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({
        injectJavaScript: jest.fn(),
      }));
      mockReact.useEffect(() => {
        lastWebViewOnMessage = onMessage;
        onMessage?.({ nativeEvent: { data: JSON.stringify({ type: 'ready' }) } });
      }, [onMessage]);
      return mockReact.createElement(View, { testID: 'native-map', ...rest });
    }
  );
  MockWebView.displayName = 'MockWebView';
  return {
    __esModule: true,
    default: MockWebView,
    WebView: MockWebView,
  };
});

jest.mock('./use-map-data', () => ({
  useMapData: jest.fn(),
}));
jest.mock('./use-map-location', () => ({
  useMapLocation: jest.fn(),
}));
jest.mock('@/context/tab-bar-inset', () => ({
  useTabBarInset: () => 0,
}));

const mockUseMapData = useMapData as jest.MockedFunction<typeof useMapData>;
const mockUseMapLocation = useMapLocation as jest.MockedFunction<typeof useMapLocation>;

const sampleItem: LaboratoryMapItem = {
  lab: {
    id: 'lab-a',
    name: 'Lab A201',
    code: 'LAB-A',
    building: 'Gedung A',
    floor: 'Lantai 2',
    room: 'A201',
    latitude: -7.0519,
    longitude: 110.4383,
    radiusMeters: 100,
    description: '',
    isActive: true,
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
    updatedBy: 'asisten-1',
  },
  locationLabel: 'Gedung A · Lantai 2 · A201',
  radiusLabel: '100 m',
  current: {
    id: 's1',
    title: 'Basis Data',
    className: 'IF-3A',
    date: '2026-11-23',
    dateLabel: 'Hari ini',
    startTime: '08:00',
    endTime: '09:40',
    timeRangeWib: '08.00–09.40 WIB',
    room: 'A201',
    status: 'open',
    statusLabel: 'Dibuka',
  },
  next: null,
  hasAnyActivity: true,
};

function setupDefaultLocation(overrides: Partial<ReturnType<typeof useMapLocation>> = {}) {
  mockUseMapLocation.mockReturnValue({
    permissionStatus: 'granted',
    servicesEnabled: true,
    position: {
      latitude: -7.0519,
      longitude: 110.4383,
      accuracyMeters: 10,
      mocked: false,
      timestamp: 1_700_000_000_000,
    },
    locationError: null,
    requestPermission: jest.fn(),
    refreshLocation: jest.fn(),
    openSettings: jest.fn(),
    ...overrides,
  });
}

describe('PetaScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastWebViewOnMessage = undefined;
    setupDefaultLocation();
  });

  it('menampilkan state loading saat data belum siap', async () => {
    mockUseMapData.mockReturnValue({
      items: [],
      activeLabs: [],
      loading: true,
      error: null,
      retry: jest.fn(),
    });

    const { getByText } = await render(<PetaScreen />);
    expect(getByText('Memuat peta dan jadwal laboratorium...')).toBeTruthy();
  });

  it('menampilkan error state dan tombol coba lagi saat Firestore gagal', async () => {
    const retry = jest.fn();
    mockUseMapData.mockReturnValue({
      items: [],
      activeLabs: [],
      loading: false,
      error: 'Koneksi bermasalah.',
      retry,
    });

    const { getByText } = await render(<PetaScreen />);
    expect(getByText('Koneksi bermasalah.')).toBeTruthy();

    await fireEvent.press(getByText('Coba lagi'));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('menampilkan empty state saat tidak ada laboratorium aktif', async () => {
    mockUseMapData.mockReturnValue({
      items: [],
      activeLabs: [],
      loading: false,
      error: null,
      retry: jest.fn(),
    });

    const { getByText } = await render(<PetaScreen />);
    expect(getByText('Belum ada laboratorium')).toBeTruthy();
  });

  it('membuka panel aktivitas saat marker OpenStreetMap dipilih dan mendukung mode daftar', async () => {
    const requestPermission = jest.fn();
    setupDefaultLocation({
      permissionStatus: 'denied',
      position: null,
      locationError: 'PERMISSION_DENIED',
      requestPermission,
    });
    mockUseMapData.mockReturnValue({
      items: [sampleItem],
      activeLabs: [sampleItem.lab],
      loading: false,
      error: null,
      retry: jest.fn(),
    });

    const { getByText, getByTestId, queryByTestId } = await render(<PetaScreen />);

    expect(getByTestId('native-map')).toBeTruthy();
    expect(getByText('Izinkan lokasi')).toBeTruthy();

    await act(async () => {
      lastWebViewOnMessage?.({
        nativeEvent: { data: JSON.stringify({ type: 'selectLab', labId: 'lab-a' }) },
      });
    });

    expect(getByText('SEKARANG')).toBeTruthy();
    expect(getByText('Basis Data')).toBeTruthy();
    expect(getByText('Dibuka')).toBeTruthy();

    await fireEvent.press(getByText('Izinkan lokasi'));
    expect(requestPermission).toHaveBeenCalledTimes(1);

    await fireEvent.press(getByText('Daftar'));
    expect(queryByTestId('native-map')).toBeNull();
    expect(getByText('Lab A201')).toBeTruthy();

    await fireEvent.press(getByText('Peta'));
    expect(getByTestId('native-map')).toBeTruthy();
  });

  it('beralih ke mode daftar fallback jika peta OpenStreetMap gagal dimuat', async () => {
    mockUseMapData.mockReturnValue({
      items: [sampleItem],
      activeLabs: [sampleItem.lab],
      loading: false,
      error: null,
      retry: jest.fn(),
    });

    const { getByText, queryByTestId } = await render(<PetaScreen />);

    await act(async () => {
      lastWebViewOnMessage?.({
        nativeEvent: { data: JSON.stringify({ type: 'error' }) },
      });
    });

    expect(queryByTestId('native-map')).toBeNull();
    expect(getByText('Peta gagal dimuat. Menampilkan mode daftar laboratorium.')).toBeTruthy();
    expect(getByText('Lab A201')).toBeTruthy();
  });
});
