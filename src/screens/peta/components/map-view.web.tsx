/**
 * map-view.web.tsx: peta interaktif OpenStreetMap (Leaflet di iframe) untuk
 * browser web, sehingga tetap interaktif tanpa API key Google Maps.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const onMapErrorRef = useRef(onMapError);

  useEffect(() => {
    onMapErrorRef.current = onMapError;
  }, [onMapError]);

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

  const initialRegion = useMemo(
    () => getInitialMapRegion(items.map((item) => item.lab)),
    // Hanya dipakai untuk region awal saat pertama mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const initialHtml = useMemo(
    () => buildOsmLeafletHtml(initialRegion, mapState),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const selectedItem = useMemo(
    () => findSelectedLabItem(items, selectedLabId),
    [items, selectedLabId]
  );

  useEffect(() => {
    if (mapReady) return;
    const timer = setTimeout(() => {
      onMapErrorRef.current?.();
    }, MAP_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [mapReady]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    function handleWindowMessage(event: MessageEvent) {
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) {
        return;
      }
      const msg = parseOsmMessage(event.data);
      if (!msg) return;
      if (msg.type === 'ready') {
        setMapReady(true);
      } else if (msg.type === 'error') {
        onMapError?.();
      } else if (msg.type === 'selectLab') {
        onSelectLab(msg.labId);
      }
    }

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [onMapError, onSelectLab]);

  useEffect(() => {
    if (!mapReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'updateState', payload: mapState },
      '*'
    );
  }, [mapReady, mapState]);

  function handleCenterPress() {
    if (userPosition) {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'centerTo',
          payload: {
            latitude: userPosition.latitude,
            longitude: userPosition.longitude,
            zoom: 17,
          },
        },
        '*'
      );
      return;
    }
    if (items.length > 0 && !onCenterRequest) {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'centerTo',
          payload: {
            latitude: initialRegion.latitude,
            longitude: initialRegion.longitude,
            zoom: 17,
          },
        },
        '*'
      );
      return;
    }
    onCenterRequest?.();
  }

  return (
    <View style={styles.container}>
      <View style={styles.frameWrap}>
        <iframe
          ref={iframeRef}
          title="Peta Laboratorium OpenStreetMap"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          srcDoc={initialHtml}
          style={iframeStyle}
        />
      </View>

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

const iframeStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block',
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    frameWrap: {
      flex: 1,
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
