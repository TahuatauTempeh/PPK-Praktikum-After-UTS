import { act, render } from '@testing-library/react-native';
import React from 'react';

import { PlatformMapView } from './map-view.native';

jest.mock('react-native-webview', () => {
  const mockReact = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockWebView = mockReact.forwardRef(
    (_props: unknown, ref: React.ForwardedRef<unknown>) => {
      mockReact.useImperativeHandle(ref, () => ({
        injectJavaScript: jest.fn(),
      }));
      return mockReact.createElement(View, { testID: 'native-map' });
    }
  );
  MockWebView.displayName = 'MockWebView';
  return {
    __esModule: true,
    default: MockWebView,
    WebView: MockWebView,
  };
});

function renderMap(onMapError: () => void) {
  return (
    <PlatformMapView
      items={[]}
      selectedLabId={null}
      onSelectLab={jest.fn()}
      userPosition={null}
      onMapError={onMapError}
    />
  );
}

describe('PlatformMapView timeout fallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('tidak mereset timer saat parent mengirim callback onMapError baru', async () => {
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();

    const { rerender } = await render(renderMap(firstCallback));

    await act(async () => {
      jest.advanceTimersByTime(11_000);
    });
    expect(firstCallback).not.toHaveBeenCalled();

    await rerender(renderMap(secondCallback));

    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });
});
