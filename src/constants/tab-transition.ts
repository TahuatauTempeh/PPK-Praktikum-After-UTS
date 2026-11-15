/**
 * Transisi geser antar tab. Layar dengan indeks lebih besar masuk dari kanan,
 * layar dengan indeks lebih kecil masuk dari kiri, mengikuti urutan tab.
 */

import { Easing, type Animated } from 'react-native';

/**
 * Gerak indikator yang bergeser: bottom tab Asisten/Praktikan dan pemilih tema.
 * Satu angka supaya kedua kontrol tidak perlahan berbeda rasa gerak.
 */
export const INDICATOR_SLIDE = {
  duration: 240,
  // Getter supaya Easing hanya dievaluasi di klien, bukan saat modul dimuat.
  get easing() {
    return Easing.out(Easing.cubic);
  },
} as const;

export const TAB_TRANSITION_SPEC = {
  animation: 'timing',
  config: {
    duration: INDICATOR_SLIDE.duration,
    get easing() {
      return INDICATOR_SLIDE.easing;
    },
  },
} as const;

export function tabSlideInterpolator(width: number) {
  return ({ current }: { current: { progress: Animated.Value } }) => ({
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-width, 0, width],
          }),
        },
      ],
    },
  });
}
