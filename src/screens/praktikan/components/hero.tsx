/**
 * Hero: banner kaca biru di puncak halaman, berisi judul dan deretan angka turunan dari state.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ikon, IkonNama } from '@/screens/praktikan/components/ikon';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';
import { HeroCard } from '@/screens/shared/components/hero-card';

interface HeroProps {
  judul: string;
  watermark: IkonNama;
  statistik: { nilai: string; label: string }[];
  sapaan?: string;
  keterangan?: string;
}

export function Hero({ judul, watermark, statistik, sapaan, keterangan }: HeroProps) {
  const theme = usePraktikanTheme();

  return (
    <HeroCard
      backgroundColor={theme.hero}
      watermark={<Ikon nama={watermark} ukuran={126} warna="#FFFFFF" />}
      padding={22}
      gap={10}
    >
      {sapaan ? <Text style={[Tipe.sapaan, { color: theme.heroTeksLembut }]}>{sapaan}</Text> : null}
      <Text accessibilityRole="header" style={[Tipe.judulHalaman, { color: theme.heroTeks }]}>
        {judul}
      </Text>
      {keterangan ? <Text style={[Tipe.caption, { color: theme.heroTeksLembut }]}>{keterangan}</Text> : null}
      <View style={[styles.baris, { borderTopColor: theme.heroGaris }]}>
        {statistik.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.statistik,
              index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.heroGaris, paddingLeft: 16 },
            ]}
          >
            <Text style={[Tipe.angka, { color: theme.heroTeks }]}>{item.nilai}</Text>
            <Text style={[Tipe.caption, { color: theme.heroTeksLembut }]}>{item.label}</Text>
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
