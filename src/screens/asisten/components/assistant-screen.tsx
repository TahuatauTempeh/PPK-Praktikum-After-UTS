import type { ComponentRef, PropsWithChildren, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, Platform, StyleSheet, View,
  type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { useReportBlurTarget } from '@/context/blur-target';
import { useTabBarInset } from '@/context/tab-bar-inset';
import {
  tokens,
  useThemedStyles,
  type Theme,
} from '@/theme';
import { AssistantAtmosphere, ATMOSPHERE_HEIGHT } from './assistant-atmosphere';
import { ASSISTANT_TOP_BAR_HEIGHT } from './assistant-top-bar';

const HEADER_TOP = 14;
const HEADER_BLOCK = HEADER_TOP + ASSISTANT_TOP_BAR_HEIGHT;

type SurfaceProps = PropsWithChildren<{
  footer?: ReactNode; header?: ReactNode; edges?: readonly Edge[];
  headerTranslateY?: Animated.Value;
}>;

/**
 * Kerangka layar Asisten tanpa area gulir. Dipakai layar yang membawa daftar
 * sendiri, seperti FlatList di halaman admin, agar virtualisasi tetap jalan.
 *
 * Header menempel absolut di atas konten. `headerTranslateY` menggesernya keluar
 * saat pengguna menggulir turun dan mengembalikannya begitu arah gulir berubah
 * ke atas, tanpa menunggu scroll kembali ke posisi teratas. Area gulir
 * mengimbangi tingginya lewat padding di AssistantScreen.
 */
export function AssistantSurface({
  children, footer, header, edges, headerTranslateY,
}: SurfaceProps) {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(gaya);
  const blurTarget = useRef<ComponentRef<typeof View> | null>(null);
  const reportBlurTarget = useReportBlurTarget();

  useEffect(() => {
    if (focused) reportBlurTarget(blurTarget);
  }, [focused, reportBlurTarget]);

  // Anak absolut tidak ikut padding SafeAreaView, jadi inset atas ditambahkan sendiri.
  const headerTop = edges === undefined || edges.includes('top') ? insets.top : 0;

  return (
    <BlurTargetView ref={blurTarget} style={styles.safeArea}>
      {focused ? <StatusBar style="light" /> : null}
      <AssistantAtmosphere />
      <SafeAreaView style={styles.area} edges={edges}>
        {children}
        {header ? (
          <View style={[styles.headerClip, { top: headerTop }]} pointerEvents="box-none">
            <Animated.View
              pointerEvents="box-none"
              style={headerTranslateY ? { transform: [{ translateY: headerTranslateY }] } : undefined}
            >
              {/* Latar yang sama dengan atmosfer halaman, digeser setinggi safe
                  area supaya sambung dengan status bar dan menutup konten. */}
              <View pointerEvents="none" accessible={false} style={styles.headerBackdropClip}>
                <View style={[styles.headerBackdrop, { top: -headerTop }]}>
                  <AssistantAtmosphere />
                </View>
              </View>
              <View style={styles.header}>{header}</View>
            </Animated.View>
          </View>
        ) : null}
        {footer}
      </SafeAreaView>
    </BlurTargetView>
  );
}

export function AssistantScreen({ children, footer, header, edges }: PropsWithChildren<{
  footer?: ReactNode; header?: ReactNode; edges?: readonly Edge[];
}>) {
  const tabBarInset = useTabBarInset();
  const styles = useThemedStyles(gaya);
  const headerTranslateY = useState(() => new Animated.Value(0))[0];
  const lastScrollY = useRef(0);
  const headerHidden = useRef(false);
  const downward = useRef(0);
  const upward = useRef(0);
  const hasHeader = header != null;

  const setHeaderHidden = (hidden: boolean) => {
    if (headerHidden.current === hidden) return;
    headerHidden.current = hidden;
    Animated.timing(headerTranslateY, {
      toValue: hidden ? -HEADER_BLOCK : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = y - lastScrollY.current;
    lastScrollY.current = y;

    if (y <= 0) {
      downward.current = 0;
      upward.current = 0;
      setHeaderHidden(false);
      return;
    }

    if (delta > 0) {
      downward.current += delta;
      upward.current = 0;
      // Header baru boleh hilang setelah konten melewati tinggi header;
      // ambang 4 px meredam getaran jari tanpa menunda arah scroll.
      if (downward.current >= 4 && y > HEADER_BLOCK) setHeaderHidden(true);
    } else if (delta < 0) {
      upward.current -= delta;
      downward.current = 0;
      if (upward.current >= 2) setHeaderHidden(false);
    }
  };

  return (
    <AssistantSurface
      header={header}
      headerTranslateY={hasHeader ? headerTranslateY : undefined}
      footer={footer}
      edges={edges}
    >
      <Animated.ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        onScroll={hasHeader ? handleScroll : undefined}
        scrollEventThrottle={16}
      >
        <View style={[styles.content, {
          paddingTop: HEADER_TOP + (hasHeader ? HEADER_BLOCK : 0),
          paddingBottom: tokens.spacing.page + tabBarInset,
        }]}>
          {children}
        </View>
      </Animated.ScrollView>
    </AssistantSurface>
  );
}

const gaya = (theme: Theme) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  area: { flex: 1 },
  headerClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_BLOCK,
    overflow: 'hidden',
  },
  headerBackdropClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_BLOCK,
    overflow: 'hidden',
  },
  headerBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ATMOSPHERE_HEIGHT,
  },
  header: {
    width: '100%',
    maxWidth: tokens.contentWidth,
    alignSelf: 'center',
    paddingHorizontal: tokens.spacing.page,
    paddingTop: HEADER_TOP,
  },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: tokens.contentWidth,
    flexGrow: 1,
    paddingHorizontal: tokens.spacing.page,
    paddingTop: HEADER_TOP,
    paddingBottom: tokens.spacing.page,
    gap: tokens.spacing.section,
  },
});
