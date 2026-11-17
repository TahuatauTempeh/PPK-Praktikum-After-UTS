/**
 * KartuProfil: kartu identitas pengguna di puncak halaman Profil.
 * Dipakai bersama oleh praktikan dan asisten; isinya terpusat: kotak ikon user,
 * nama, nomor identitas, dan badge peran di atas kaca biru gelap.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ikon } from '@/screens/praktikan/components/ikon';
import { fonts, typography, useTheme } from '@/theme';

import { HeroCard } from './hero-card';

interface KartuProfilProps {
  nama: string;
  nomor: string;
  peran: string;
}

export function KartuProfil({ nama, nomor, peran }: KartuProfilProps) {
  const theme = useTheme();

  return (
    <HeroCard
      backgroundColor={theme.colors.glassHero}
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
        <Ikon nama="profil" ukuran={36} warna={theme.colors.onHero} />
      </View>

      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={[typography.pageTitle, styles.tengah, { color: theme.colors.onHero }]}
      >
        {nama}
      </Text>
      <Text style={[typography.body, styles.tengah, { color: theme.colors.heroSoft }]}>{nomor}</Text>

      <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
        <Text style={[typography.tiny, styles.badgeTeks, { color: theme.colors.onHero }]}>{peran}</Text>
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
    fontFamily: fonts.semibold,
  },
});
