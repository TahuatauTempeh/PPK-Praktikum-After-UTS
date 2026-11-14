/**
 * KartuProfil: kartu identitas pengguna di puncak halaman Profil.
 * Dipakai bersama oleh praktikan dan asisten; isinya terpusat: kotak ikon user,
 * nama, nomor identitas, dan badge peran di atas kaca biru gelap.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ikon } from '@/screens/praktikan/components/ikon';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

import { HeroCard } from './hero-card';

interface KartuProfilProps {
  nama: string;
  nomor: string;
  peran: string;
}

export function KartuProfil({ nama, nomor, peran }: KartuProfilProps) {
  const theme = usePraktikanTheme();

  return (
    <HeroCard
      backgroundColor={theme.hero}
      padding={24}
      gap={6}
      contentStyle={styles.content}
    >
      <View
        style={[
          styles.kotakIkon,
          { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.35)' },
        ]}
      >
        <Ikon nama="profil" ukuran={36} warna={theme.heroTeks} />
      </View>

      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={[Tipe.judulHalaman, styles.tengah, { color: theme.heroTeks }]}
      >
        {nama}
      </Text>
      <Text style={[Tipe.body, styles.tengah, { color: theme.heroTeksLembut }]}>{nomor}</Text>

      <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
        <Text style={[Tipe.kecil, styles.badgeTeks, { color: theme.heroTeks }]}>{peran}</Text>
      </View>
    </HeroCard>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  kotakIkon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderRadius: 24,
    borderWidth: 1,
  },
  tengah: {
    textAlign: 'center',
  },
  badge: {
    alignSelf: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeTeks: {
    fontWeight: '600',
  },
});
