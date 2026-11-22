/**
 * map-view.native.tsx: peta interaktif native (Google Maps di Android,
 * Apple Maps di iOS) dengan marker laboratorium, marker posisi pengguna,
 * panel detail lab, tombol pusatkan lokasi, dan proteksi kegagalan muat.
 */

import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, {
  Circle,
  Marker,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

import { useTheme, useThemedStyles, type Theme } from '@/theme';

import { findSelectedLabItem, getInitialMapRegion } from '../selectors';
import { LabActivityCard } from './lab-activity-card';
import type { MapViewProps } from './map-view.types';

const MAP_READY_TIMEOUT_MS = 10_000;

interface ErrorBoundaryProps {
  onError: () => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

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
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const initialRegion = useMemo(
    () => getInitialMapRegion(items.map((item) => item.lab)),
    // Hanya dipakai untuk region awal saat pertama mount.
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
    if (!mapReady || !selectedItem) return;
    mapRef.current?.animateToRegion(
      {
        latitude: selectedItem.lab.latitude,
        longitude: selectedItem.lab.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      },
      350
    );
  }, [mapReady, selectedItem]);

  function handleCenterPress() {
    if (userPosition) {
      mapRef.current?.animateToRegion(
        {
          latitude: userPosition.latitude,
          longitude: userPosition.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        350
      );
      return;
    }
    onCenterRequest?.();
  }

  return (
    <View style={styles.container}>
      <MapErrorBoundary onError={() => onMapError?.()}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          initialRegion={initialRegion}
          onMapReady={() => setMapReady(true)}
          onPress={() => onSelectLab(null)}
          showsCompass
          toolbarEnabled={false}
        >
          {items.map((item) => {
            const isOpen = item.current?.status === 'open';
            const isSelected = item.lab.id === selectedLabId;
            const description = item.current
              ? `${item.current.title} (${item.current.statusLabel})`
              : item.locationLabel;

            return (
              <Marker
                key={item.lab.id}
                coordinate={{
                  latitude: item.lab.latitude,
                  longitude: item.lab.longitude,
                }}
                title={item.lab.name}
                description={description}
                pinColor={
                  isSelected || isOpen ? theme.colors.success : theme.colors.primaryFill
                }
                accessibilityLabel={`${item.lab.name}, ${
                  item.current
                    ? `${item.current.title}, ${item.current.statusLabel}`
                    : 'Belum ada praktikum terjadwal'
                }`}
                onPress={(event) => {
                  event.stopPropagation();
                  onSelectLab(item.lab.id);
                }}
              />
            );
          })}

          {selectedItem ? (
            <Circle
              center={{
                latitude: selectedItem.lab.latitude,
                longitude: selectedItem.lab.longitude,
              }}
              radius={selectedItem.lab.radiusMeters}
              strokeColor={theme.colors.primary}
              fillColor={theme.colors.glassGlowBlue}
              strokeWidth={2}
            />
          ) : null}

          {userPosition ? (
            <>
              <Circle
                center={{
                  latitude: userPosition.latitude,
                  longitude: userPosition.longitude,
                }}
                radius={Math.max(10, Math.min(userPosition.accuracyMeters || 25, 200))}
                strokeColor={theme.colors.primary}
                fillColor={theme.colors.glassGlowBlue}
                strokeWidth={1}
              />
              <Marker
                coordinate={{
                  latitude: userPosition.latitude,
                  longitude: userPosition.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                title="Posisi kamu"
                tracksViewChanges={false}
                accessibilityLabel="Posisi kamu saat ini"
              >
                <View style={styles.userDotOuter}>
                  <View style={styles.userDotInner} />
                </View>
              </Marker>
            </>
          ) : null}
        </MapView>
      </MapErrorBoundary>

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
    userDotOuter: {
      width: 22,
      height: 22,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.onPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primaryFill,
    },
    userDotInner: {
      width: 10,
      height: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primaryFill,
    },
    pressed: {
      opacity: 0.8,
    },
  });
