/**
 * NavigasiPraktikan: bar tab bawah berbentuk kapsul kaca dengan indikator aktif yang bergeser.
 * Dipasang lewat prop tabBar di Tabs, jadi tab tetap dikelola Expo Router.
 */

import { router, Tabs } from 'expo-router';
import React, { ComponentProps, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { INDICATOR_SLIDE } from '@/constants/tab-transition';
import { Ikon, IkonNama } from '@/screens/praktikan/components/ikon';
import { fonts, typography, useTheme } from '@/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB: Record<string, { label: string; ikon: IkonNama }> = {
  index: { label: 'Jadwal', ikon: 'jadwal' },
  riwayat: { label: 'Riwayat', ikon: 'riwayat' },
  profil: { label: 'Profil', ikon: 'profil' },
};

const RUTE: Record<string, '/(praktikan)' | '/(praktikan)/riwayat' | '/(praktikan)/profil'> = {
  index: '/(praktikan)',
  riwayat: '/(praktikan)/riwayat',
  profil: '/(praktikan)/profil',
};

const JARAK = 8;
const PADDING = 6;
const BAR_RADIUS = 32;
const TAB_RADIUS = BAR_RADIUS - PADDING;

export function NavigasiPraktikan({ state, emitter, insets }: TabBarProps) {
  const theme = useTheme();
  const [lebar, setLebar] = useState<number | null>(null);
  const [geser] = useState(() => new Animated.Value(0));
  const sudahDitaruh = useRef(false);

  const rute = state.routes.filter((r) => r.name in TAB);
  const indeks = Math.max(0, rute.findIndex((r) => r.key === state.routes[state.index].key));

  useEffect(() => {
    if (!lebar) return;
    const tujuan = indeks * (lebar + JARAK);
    if (!sudahDitaruh.current) {
      sudahDitaruh.current = true;
      geser.setValue(tujuan);
      return;
    }
    const animasi = Animated.timing(geser, {
      toValue: tujuan,
      ...INDICATOR_SLIDE,
      useNativeDriver: Platform.OS !== 'web',
    });
    animasi.start();
    return () => animasi.stop();
  }, [indeks, geser, lebar]);

  return (
    <View style={[styles.dasar, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      <View
        accessibilityRole="tablist"
        style={[
          styles.bar,
          { backgroundColor: theme.colors.navSurface, borderColor: theme.colors.glassBorder, boxShadow: theme.colors.shadow },
        ]}
      >
        <View style={[styles.tabs, { gap: JARAK }]}>
          {lebar !== null ? (
            <Animated.View
              pointerEvents="none"
              accessible={false}
              style={[
                styles.indikator,
                {
                  backgroundColor: theme.colors.primarySoft,
                  width: lebar,
                  transform: [{ translateX: geser }],
                },
              ]}
            />
          ) : null}
          {rute.map((r, i) => {
            const terpilih = i === indeks;
            const warna = terpilih ? theme.colors.primary : theme.colors.iconMuted;
            const onPress = () => {
              const kejadian = emitter.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
              if (!terpilih && !kejadian.defaultPrevented) router.navigate(RUTE[r.name]);
            };
            return (
              <Pressable
                key={r.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: terpilih }}
                accessibilityLabel={TAB[r.name].label}
                onPress={onPress}
                onLayout={i === 0 ? (e) => setLebar(e.nativeEvent.layout.width) : undefined}
                style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
              >
                <Ikon nama={TAB[r.name].ikon} ukuran={18} warna={warna} />
                <Text style={[typography.tiny, { color: warna }, terpilih && styles.tebal]}>
                  {TAB[r.name].label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dasar: { paddingHorizontal: 16 },
  bar: {
    padding: PADDING,
    marginVertical: 10,
    borderRadius: BAR_RADIUS,
    borderWidth: 1,
    width: '100%',
    maxWidth: 552,
    alignSelf: 'center',
  },
  tabs: { flexDirection: 'row', position: 'relative' },
  indikator: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: TAB_RADIUS },
  tab: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: TAB_RADIUS, paddingVertical: 10 },
  tebal: { fontFamily: fonts.bold },
});
