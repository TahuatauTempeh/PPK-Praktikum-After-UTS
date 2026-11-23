/**
 * map-view.native.tsx: peta interaktif OpenStreetMap (Leaflet di WebView)
 * untuk Android & iOS tanpa membutuhkan Google Maps API Key atau billing.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';

import { useTheme, useThemedStyles, type Theme } from '@/theme';

import { findSelectedLabItem, getInitialMapRegion } from '../selectors';
import { LabActivityCard } from './lab-activity-card';
import type { MapViewProps } from './map-view.types';
import {
  buildOsmLeafletHtml,
  parseOsmMessage,
  toOsmLabMarkers,
  type OsmMapStatePayload,
} from './osm-leaflet-html';

const MAP_READY_TIMEOUT_MS = 12_000;

export function PlatformMapView({
  items,
  selectedLabId,
  onSelectLab,
  userPosition,
  bottomInset = 0,
  banner,
  onMapError,
  onCenterRequest,
}: MapViewProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const webViewRef = useRef<WebView<object> | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapState = useMemo<OsmMapStatePayload>(
    () => ({
      labs: toOsmLabMarkers(items),
      selectedLabId,
      userPosition,
      colors: {
        primary: theme.colors.primaryFill,
        success: theme.colors.successFill,
        surface: theme.colors.surface,
        text: theme.colors.textPrimary,
        accent: theme.colors.primary,
      },
    }),
    [
      items,
      selectedLabId,
      theme.colors.primary,
      theme.colors.primaryFill,
      theme.colors.successFill,
      theme.colors.surface,
      theme.colors.textPrimary,
      userPosition,
    ]
  );

  // HTML hanya dibentuk sekali saat mount agar WebView tidak reload ketika data berubah.
  const initialHtml = useMemo(
    () =>
      buildOsmLeafletHtml(
        getInitialMapRegion(items.map((item) => item.lab)),
        mapState
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const selectedItem = useMemo(
    () => findSelectedLabItem(items, selectedLabId),
    [items, selectedLabId]
  );

  useEffect(() => {
    if (mapReady || !onMapError) return;
    const timer = setTimeout(() => {
      onMapError();
    }, MAP_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [mapReady, onMapError]);

  useEffect(() => {
    if (!mapReady) return;
    const payload = JSON.stringify(mapState);
    webViewRef.current?.injectJavaScript(
      `window.__OSM_MAP__ && window.__OSM_MAP__.updateState(${payload}); true;`
    );
  }, [mapReady, mapState]);

  function handleMessage(event: WebViewMessageEvent) {
    const msg = parseOsmMessage(event.nativeEvent.data);
    if (!msg) return;
    if (msg.type === 'ready') {
      setMapReady(true);
    } else if (msg.type === 'error') {
      onMapError?.();
    } else if (msg.type === 'selectLab') {
      onSelectLab(msg.labId);
    }
  }

  function handleCenterPress() {
    if (userPosition) {
      webViewRef.current?.injectJavaScript(
        `window.__OSM_MAP__ && window.__OSM_MAP__.centerTo(${userPosition.latitude}, ${userPosition.longitude}, 17); true;`
      );
      return;
    }
    onCenterRequest?.();
  }

  return (
    <View style={styles.container}>
      <WebView<object>
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: initialHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onError={() => onMapError?.()}
        onHttpError={() => onMapError?.()}
      />

      {banner ? (
        <View pointerEvents="box-none" style={styles.bannerOverlay}>
          {banner}
        </View>
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          styles.bottomOverlay,
          { paddingBottom: bottomInset + theme.spacing.sm },
        ]}
      >
        <View style={styles.floatingControls}>
          <Pressable
            onPress={handleCenterPress}
            accessibilityRole="button"
            accessibilityLabel="Pusatkan lokasi"
            style={({ pressed }) => [styles.centerButton, pressed && styles.pressed]}
          >
            <Text style={styles.centerButtonText}>Pusatkan lokasi</Text>
          </Pressable>
        </View>

        {selectedItem ? (
          <ScrollView
            style={styles.detailScroll}
            showsVerticalScrollIndicator={false}
          >
            <LabActivityCard
              item={selectedItem}
              onClose={() => onSelectLab(null)}
            />
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    webview: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    bannerOverlay: {
      position: 'absolute',
      top: theme.spacing.sm,
      left: theme.spacing.base,
      right: theme.spacing.base,
    },
    bottomOverlay: {
      position: 'absolute',
      left: theme.spacing.base,
      right: theme.spacing.base,
      bottom: 0,
      gap: theme.spacing.sm,
    },
    floatingControls: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    centerButton: {
      minHeight: 44,
      minWidth: 44,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.base,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      boxShadow: theme.colors.shadow,
    },
    centerButtonText: {
      ...theme.typography.caption,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.primary,
    },
    detailScroll: {
      maxHeight: 320,
    },
    pressed: {
      opacity: 0.8,
    },
  });
