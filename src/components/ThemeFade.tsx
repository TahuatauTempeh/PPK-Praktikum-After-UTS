/**
 * Tirai fade saat palet tema berganti. Warna dan gradiennya milik tema tujuan,
 * jadi halaman meredup atau menerang ke latar yang baru, bukan ke latar lama.
 * Selama tirai opak, `ThemePreferenceProvider` menukar palet; satu frame
 * setelah commit tirai memudar keluar dan halaman tampil dengan tema baru.
 *
 * Dekoratif: tidak menerima sentuhan dan disembunyikan dari pembaca layar.
 */

import { Image } from 'expo-image';
import React from 'react';
import { Animated, StyleSheet } from 'react-native';

import type { AppColorScheme } from '@/context/theme-context';
import { dark, light } from '@/theme/colors';

/** Sama dengan ATMOSPHERE_HEIGHT di assistant-atmosphere. */
const ATMOSPHERE_HEIGHT = 680;

const atmospheres = {
  light: require('@/assets/praktikan/atmosfer.svg'),
  dark: require('@/assets/praktikan/atmosfer-gelap.svg'),
};

const backgrounds: Record<AppColorScheme, string> = {
  light: light.background,
  dark: dark.background,
};

type Props = {
  /** Skema tujuan yang sedang dipudarkan masuk. */
  scheme: AppColorScheme;
  opacity: Animated.Value;
};

export function ThemeFade({ scheme, opacity }: Props) {
  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        StyleSheet.absoluteFill,
        styles.veil,
        { backgroundColor: backgrounds[scheme], opacity },
      ]}
    >
      <Image
        source={atmospheres[scheme]}
        contentFit="fill"
        style={styles.gradient}
        accessible={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  veil: { zIndex: 1000 },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: ATMOSPHERE_HEIGHT,
  },
});
