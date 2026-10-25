import { useState, type PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { assistantTheme as theme } from '../theme';

/** Ukuran kapsul ringkasan kehadiran dan jarak cekungan tempat kapsul itu duduk. */
export const summaryDock = { width: 172, height: 58, radius: 22, gap: 12 } as const;

const NOTCH_GAP = summaryDock.gap;
const NOTCH_FILLET = summaryDock.radius + NOTCH_GAP;
const RETURN_FILLET = summaryDock.radius;
const decorativeSvgAccessibility = Platform.OS === 'web'
  ? { 'aria-hidden': true }
  : { accessible: false };

/** Siluet kartu: persegi membulat dengan cekungan inverse radius di sudut kanan bawah. */
function surfacePath(width: number, height: number) {
  const radius = theme.radius.card;
  const top = height - summaryDock.height - NOTCH_GAP;
  const left = width - summaryDock.width - NOTCH_GAP;
  return [
    `M${radius} 0`,
    `H${width - radius}`,
    `A${radius} ${radius} 0 0 1 ${width} ${radius}`,
    `V${top - NOTCH_FILLET}`,
    `Q${width} ${top} ${width - NOTCH_FILLET} ${top}`,
    `H${left + NOTCH_FILLET}`,
    `Q${left} ${top} ${left} ${top + NOTCH_FILLET}`,
    `V${height - RETURN_FILLET}`,
    `Q${left} ${height} ${left - RETURN_FILLET} ${height}`,
    `H${radius}`,
    `A${radius} ${radius} 0 0 1 0 ${height - radius}`,
    `V${radius}`,
    `A${radius} ${radius} 0 0 1 ${radius} 0`,
    'Z',
  ].join(' ');
}

type Props = { style?: StyleProp<ViewStyle> };

/** Latar kartu sesi bercekung; anak-anaknya digambar di atas siluet ini. */
export function SessionCardSurface({ style, children }: PropsWithChildren<Props>) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const path = size ? surfacePath(size.width, size.height) : null;

  function measure(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize(current => current && current.width === width && current.height === height ? current : { width, height });
  }

  return (
    <View style={[styles.surface, style, path ? null : styles.fallback]} onLayout={measure}>
      {size && path && (
        <Svg {...decorativeSvgAccessibility} style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient id="sessionGlass" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.94} />
              <Stop offset="1" stopColor="#F7FAFF" stopOpacity={0.65} />
            </LinearGradient>
            <RadialGradient id="sessionGlassBlue">
              <Stop offset="0" stopColor="#A7C7FF" stopOpacity={0.55} />
              <Stop offset="1" stopColor="#A7C7FF" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="sessionGlassLime">
              <Stop offset="0" stopColor="#E3EFA8" stopOpacity={0.4} />
              <Stop offset="1" stopColor="#E3EFA8" stopOpacity={0} />
            </RadialGradient>
            <ClipPath id="sessionSurface"><Path d={path} /></ClipPath>
          </Defs>
          <Path d={path} fill={theme.colors.glassSurface} stroke={theme.colors.glassBorder} strokeWidth={1} />
          <G clipPath="url(#sessionSurface)">
            <Rect x={0} y={0} width={size.width} height={size.height} fill="url(#sessionGlass)" />
            <Ellipse cx={size.width * 0.93} cy={size.height * 0.03} rx={size.width * 0.58} ry={size.height * 0.55}
              fill="url(#sessionGlassBlue)" />
            <Ellipse cx={size.width * 0.92} cy={size.height * 0.9} rx={size.width * 0.48} ry={size.height * 0.52}
              fill="url(#sessionGlassLime)" />
          </G>
        </Svg>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { position: 'relative', borderRadius: theme.radius.card },
  fallback: { backgroundColor: theme.colors.glassSurface, borderWidth: 1, borderColor: theme.colors.glassBorder },
});
