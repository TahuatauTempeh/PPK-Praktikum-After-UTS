/**
 * Hero: banner kaca biru di puncak halaman, berisi judul dan deretan angka turunan dari state.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ikon, IkonNama } from '@/screens/praktikan/components/ikon';
import { typography, useTheme } from '@/theme';
import { HeroCard } from '@/screens/shared/components/hero-card';

interface HeroProps {
  judul: string;
  watermark: IkonNama;
  statistik: { nilai: string; label: string }[];
  sapaan?: string;
  keterangan?: string;
}

export function Hero({ judul, watermark, statistik, sapaan, keterangan }: HeroProps) {
  const theme = useTheme();

  return (
    <HeroCard
      backgroundColor={theme.colors.glassHero}
      watermark={<Ikon nama={watermark} ukuran={126} warna="#FFFFFF" />}
      padding={22}
      gap={10}
    >
      {sapaan ? <Text style={[typography.greeting, { color: theme.colors.heroSoft }]}>{sapaan}</Text> : null}
      <Text accessibilityRole="header" style={[typography.pageTitle, { color: theme.colors.onHero }]}>
        {judul}
      </Text>
      {keterangan ? <Text style={[typography.caption, { color: theme.colors.heroSoft }]}>{keterangan}</Text> : null}
      <View style={[styles.baris, { borderTopColor: theme.colors.heroLine }]}>
        {statistik.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.statistik,
              index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.colors.heroLine, paddingLeft: 16 },
            ]}
          >
            <Text style={[typography.numeric, { color: theme.colors.onHero }]}>{item.nilai}</Text>
            <Text style={[typography.caption, { color: theme.colors.heroSoft }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </HeroCard>
  );
}

const styles = StyleSheet.create({
  baris: { flexDirection: 'row', marginTop: 6, paddingTop: 16, borderTopWidth: 1 },
  statistik: { flex: 1, gap: 2 },
});
