/**
 * map-view.web.tsx: fallback peta di browser web menggunakan mode daftar
 * laboratorium karena react-native-maps hanya mendukung native.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemedStyles, type Theme } from '@/theme';

import { LabListMode } from './lab-list-mode';
import { LocationBanner } from './location-banner';
import type { MapViewProps } from './map-view.types';

export function PlatformMapView({
  items,
  selectedLabId,
  onSelectLab,
  bottomInset = 0,
  banner,
}: MapViewProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <LabListMode
        items={items}
        selectedLabId={selectedLabId}
        onSelectLab={onSelectLab}
        bottomInset={bottomInset}
        headerSlot={
          <View style={styles.banners}>
            {banner}
            <LocationBanner
              tone="info"
              message="Mode daftar ditampilkan di web. Peta interaktif tersedia di aplikasi Android dan iOS."
            />
          </View>
        }
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    banners: {
      gap: theme.spacing.sm,
    },
  });
