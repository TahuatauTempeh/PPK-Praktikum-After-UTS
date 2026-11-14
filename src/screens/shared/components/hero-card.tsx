import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type Props = PropsWithChildren<{
  backgroundColor: string;
  watermark?: ReactNode;
  padding?: number;
  gap?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

const decorativeSvgAccessibility = Platform.OS === 'web'
  ? { 'aria-hidden': true as const }
  : { accessible: false };

/**
 * Gradien kedalaman yang sama untuk semua hero. Lapisan gelap tipis di atas
 * memudar ke bawah, mengikuti arah atmosfer halaman. Tidak menambah kecerahan
 * di area teks sehingga kontras tetap aman.
 */
function HeroDepth() {
  return (
    <Svg
      {...decorativeSvgAccessibility}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
    >
      <Defs>
        <LinearGradient id="heroCardDepth" x1="0" y1="0" x2="0.25" y2="1">
          <Stop offset="0" stopColor="#081840" stopOpacity={0.14} />
          <Stop offset="0.5" stopColor="#081840" stopOpacity={0.03} />
          <Stop offset="1" stopColor="#081840" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroCardDepth)" />
    </Svg>
  );
}

/**
 * Surface hero bersama untuk profile, Asisten, admin, Rekap, dan Praktikan.
 * Warna dasar tetap berasal dari token area masing-masing; border, radius,
 * watermark, dan gradien kedalaman disatukan di sini.
 */
export function HeroCard({
  children,
  backgroundColor,
  watermark,
  padding = 22,
  gap = 10,
  radius = 30,
  style,
  contentStyle,
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor, padding, borderRadius: radius }, style]}>
      <HeroDepth />
      {watermark ? (
        <View pointerEvents="none" accessible={false} style={styles.watermark}>
          {watermark}
        </View>
      ) : null}
      <View style={[styles.content, { gap }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  watermark: {
    position: 'absolute',
    top: -12,
    right: -16,
    opacity: 0.12,
  },
  content: {
    position: 'relative',
  },
});
