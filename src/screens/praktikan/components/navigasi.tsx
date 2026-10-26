/**
 * NavigasiPraktikan: bar tab bawah berbentuk kapsul kaca dengan indikator aktif yang bergeser.
 * Dipasang lewat prop tabBar di Tabs, jadi tab tetap dikelola Expo Router.
 */

import { Tabs } from 'expo-router';
import React, { ComponentProps, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Ikon, IkonNama } from '@/screens/praktikan/components/ikon';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB: Record<string, { label: string; ikon: IkonNama }> = {
  index: { label: 'Jadwal', ikon: 'jadwal' },
  riwayat: { label: 'Riwayat', ikon: 'riwayat' },
  profil: { label: 'Profil', ikon: 'profil' },
};

const JARAK = 8;

export function NavigasiPraktikan({ state, emitter, navigateToTab, insets }: TabBarProps) {
  const theme = usePraktikanTheme();
  const [kotak, setKotak] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [geser] = useState(() => new Animated.Value(0));
  const sudahDitaruh = useRef(false);

  const rute = state.routes.filter((r) => r.name in TAB);
  const indeks = Math.max(0, rute.findIndex((r) => r.key === state.routes[state.index].key));

  useEffect(() => {
    if (!kotak) return;
    const tujuan = indeks * (kotak.width + JARAK);
    if (!sudahDitaruh.current) {
      sudahDitaruh.current = true;
      geser.setValue(tujuan);
      return;
    }
    const animasi = Animated.timing(geser, {
      toValue: tujuan,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animasi.start();
    return () => animasi.stop();
  }, [indeks, geser, kotak]);

  return (
    <View style={[styles.dasar, { backgroundColor: theme.dasarNav, paddingBottom: insets.bottom }]}>
      <View
        accessibilityRole="tablist"
        style={[
          styles.bar,
          { backgroundColor: theme.navLatar, borderColor: theme.garisKartu, boxShadow: theme.bayang },
        ]}
      >
        {kotak ? (
          <Animated.View
            pointerEvents="none"
            accessible={false}
            style={[
              styles.indikator,
              {
                backgroundColor: theme.navAktif,
                left: kotak.x,
                top: kotak.y,
                width: kotak.width,
                height: kotak.height,
                transform: [{ translateX: geser }],
              },
            ]}
          />
        ) : null}
        {rute.map((r, i) => {
          const terpilih = i === indeks;
          const warna = terpilih ? theme.aksen : theme.ikonNonaktif;
          const onPress = () => {
            const kejadian = emitter.emit({ type: 'tabPress', target: r.key, canPreventDefault: true });
            if (!terpilih && !kejadian.defaultPrevented) navigateToTab(r.key);
          };
          return (
            <Pressable
              key={r.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: terpilih }}
              accessibilityLabel={TAB[r.name].label}
              onPress={onPress}
              onLayout={i === 0 ? (e) => setKotak(e.nativeEvent.layout) : undefined}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
            >
              <Ikon nama={TAB[r.name].ikon} ukuran={22} warna={warna} />
              <Text style={[Tipe.caption, { color: warna, fontWeight: terpilih ? '700' : '400' }]}>
                {TAB[r.name].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dasar: { paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    gap: JARAK,
    padding: 8,
    marginVertical: 10,
    borderRadius: 32,
    borderWidth: 1,
    width: '100%',
    maxWidth: 552,
    alignSelf: 'center',
  },
  indikator: { position: 'absolute', borderRadius: 24 },
  tab: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 24 },
});
