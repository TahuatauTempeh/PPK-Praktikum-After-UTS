/**
 * peta-screen.tsx: layar utama Peta Laboratorium untuk Praktikan dan Asisten.
 * Menggabungkan data realtime lab/sesi/kelas, status izin & posisi perangkat,
 * mode peta native, serta mode daftar yang aksesibel dan fallback web.
 */

import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { useTabBarInset } from '@/context/tab-bar-inset';
import { useThemedStyles, type Theme } from '@/theme';

import { LabListMode } from './components/lab-list-mode';
import { LocationBanner } from './components/location-banner';
import { PlatformMapView } from './components/map-view';
import { useMapData } from './use-map-data';
import { useMapLocation } from './use-map-location';

export interface PetaScreenProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

export function PetaScreen({ showBackButton = false, onBack }: PetaScreenProps) {
  const styles = useThemedStyles(createStyles);
  const tabBarInset = useTabBarInset();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(tabBarInset, insets.bottom);
  const isWeb = Platform.OS === 'web';

  const { items, loading, error, retry } = useMapData();
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>(() => (isWeb ? 'list' : 'map'));
  const [mapLoadFailed, setMapLoadFailed] = useState(false);

  const location = useMapLocation(true);

  const effectiveSelectedId = useMemo(() => {
    if (!selectedLabId) return null;
    return items.some((item) => item.lab.id === selectedLabId) ? selectedLabId : null;
  }, [items, selectedLabId]);

  const showListMode = viewMode === 'list' || mapLoadFailed;

  function renderLocationOrMapBanner() {
    if (mapLoadFailed) {
      return (
        <LocationBanner
          tone="error"
          message="Peta gagal dimuat. Menampilkan mode daftar laboratorium."
          actionLabel="Coba muat peta"
          onAction={() => {
            setMapLoadFailed(false);
            setViewMode('map');
          }}
        />
      );
    }

    if (location.permissionStatus === 'blocked') {
      if (isWeb) {
        return (
          <LocationBanner
            tone="warning"
            message="Izin lokasi browser diblokir. Aktifkan izin lokasi di pengaturan situs browser, lalu periksa lagi."
            actionLabel="Periksa lagi"
            onAction={() => void location.refreshLocation()}
          />
        );
      }
      return (
        <LocationBanner
          tone="warning"
          message="Izin lokasi diblokir. Aktifkan di pengaturan untuk melihat posisimu di peta."
          actionLabel="Buka pengaturan"
          onAction={() => void location.openSettings()}
          secondaryLabel="Periksa lagi"
          onSecondary={() => void location.refreshLocation()}
        />
      );
    }

    if (location.permissionStatus === 'denied') {
      return (
        <LocationBanner
          tone="warning"
          message="Izin lokasi diperlukan untuk menampilkan posisimu di peta."
          actionLabel="Izinkan lokasi"
          onAction={() => void location.requestPermission()}
          secondaryLabel={isWeb ? undefined : 'Buka pengaturan'}
          onSecondary={isWeb ? undefined : () => void location.openSettings()}
        />
      );
    }

    if (location.permissionStatus === 'granted' && !location.servicesEnabled) {
      return (
        <LocationBanner
          tone="warning"
          message="Layanan lokasi nonaktif. Aktifkan GPS untuk melihat posisimu di peta."
          actionLabel="Buka pengaturan lokasi"
          onAction={() => void location.openSettings()}
          secondaryLabel="Periksa lagi"
          onSecondary={() => void location.refreshLocation()}
        />
      );
    }

    if (
      location.permissionStatus === 'granted' &&
      location.servicesEnabled &&
      !location.position &&
      (location.locationError === 'TIMEOUT' || location.locationError === 'UNAVAILABLE')
    ) {
      return (
        <LocationBanner
          tone="info"
          message="Lokasi perangkat belum tersedia. Peta tetap menampilkan laboratorium aktif."
          actionLabel="Periksa lagi"
          onAction={() => void location.refreshLocation()}
        />
      );
    }

    return null;
  }

  const topBanner = renderLocationOrMapBanner();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showBackButton && onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Text style={styles.backButtonText}>Kembali</Text>
            </Pressable>
          ) : null}

          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" style={styles.title}>
              Peta Laboratorium
            </Text>
            <Text style={styles.subtitle}>
              {loading
                ? 'Memuat data laboratorium...'
                : `${items.length} laboratorium aktif`}
            </Text>
          </View>
        </View>

        {!loading && !error && items.length > 0 ? (
          <Pressable
            onPress={() => {
              if (mapLoadFailed) {
                setMapLoadFailed(false);
                setViewMode('map');
                return;
              }
              setViewMode((prev) => (prev === 'map' ? 'list' : 'map'));
            }}
            accessibilityRole="button"
            accessibilityLabel={showListMode ? 'Tampilkan peta' : 'Daftar'}
            style={({ pressed }) => [styles.modeButton, pressed && styles.pressed]}
          >
            <Text style={styles.modeButtonText}>
              {showListMode ? 'Peta' : 'Daftar'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.content}>
        {loading ? (
          <LoadingState message="Memuat peta dan jadwal laboratorium..." />
        ) : error ? (
          <ErrorState
            title="Gagal memuat data peta"
            message={error}
            onRetry={retry}
            retryLabel="Coba lagi"
          />
        ) : items.length === 0 ? (
          <LabListMode
            items={[]}
            selectedLabId={null}
            onSelectLab={setSelectedLabId}
            bottomInset={bottomInset}
            headerSlot={topBanner}
          />
        ) : showListMode ? (
          <LabListMode
            items={items}
            selectedLabId={effectiveSelectedId}
            onSelectLab={setSelectedLabId}
            bottomInset={bottomInset}
            headerSlot={topBanner}
            onFocusOnMap={
              !mapLoadFailed
                ? (labId) => {
                    setSelectedLabId(labId);
                    setViewMode('map');
                  }
                : undefined
            }
          />
        ) : (
          <PlatformMapView
            items={items}
            selectedLabId={effectiveSelectedId}
            onSelectLab={setSelectedLabId}
            userPosition={location.position}
            bottomInset={bottomInset}
            banner={topBanner}
            onMapError={() => setMapLoadFailed(true)}
            onCenterRequest={() => {
              if (location.permissionStatus === 'denied') {
                void location.requestPermission();
              } else if (
                location.permissionStatus === 'blocked' ||
                !location.servicesEnabled
              ) {
                if (isWeb) void location.refreshLocation();
                else void location.openSettings();
              } else {
                void location.refreshLocation();
              }
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.base,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.hairline,
      backgroundColor: theme.colors.background,
      gap: theme.spacing.sm,
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    backButton: {
      minHeight: 44,
      minWidth: 44,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.button,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    backButtonText: {
      ...theme.typography.caption,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.textPrimary,
    },
    titleBlock: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    title: {
      ...theme.typography.sectionHeading,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    modeButton: {
      minHeight: 44,
      minWidth: 44,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.base,
      borderRadius: theme.radius.button,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modeButtonText: {
      ...theme.typography.caption,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
    },
    pressed: {
      opacity: 0.8,
    },
  });
