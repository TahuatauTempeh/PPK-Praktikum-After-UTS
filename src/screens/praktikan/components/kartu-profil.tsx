/**
 * KartuProfil: kartu identitas praktikan di puncak halaman Profil.
 * Memakai DNA yang sama dengan Hero dan AgendaBanner: kaca biru gelap, watermark,
 * dan teks putih. Susunannya asimetris seperti kartu identitas, bukan avatar di tengah.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ikon } from '@/screens/praktikan/components/ikon';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

interface KartuProfilProps {
  nama: string;
  nomor: string;
  peran: string;
}

function buatInisial(nama: string) {
  const inisial = nama
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((kata) => kata[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return inisial || '?';
}

export function KartuProfil({ nama, nomor, peran }: KartuProfilProps) {
  const theme = usePraktikanTheme();

  return (
    <View style={[styles.kartu, { backgroundColor: theme.hero, borderColor: 'rgba(255,255,255,0.3)' }]}>
      <View pointerEvents="none" accessible={false} style={styles.watermark}>
        <Ikon nama="profil" ukuran={126} warna="#FFFFFF" />
      </View>

      <Text style={[Tipe.eyebrow, { color: theme.heroTeksLembut }]}>KARTU PRAKTIKAN</Text>

      <View style={styles.identitas}>
        <View
          style={[
            styles.monogram,
            { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.35)' },
          ]}
        >
          <Text style={[styles.inisial, { color: theme.heroTeks }]}>{buatInisial(nama)}</Text>
        </View>

        <View style={styles.teks}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[Tipe.judulHalaman, { color: theme.heroTeks }]}
          >
            {nama}
          </Text>
          <Text style={[Tipe.caption, { color: theme.heroTeksLembut }]}>NIM {nomor}</Text>
          <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
            <Text style={[Tipe.kecil, styles.badgeTeks, { color: theme.heroTeks }]}>{peran}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: {
    overflow: 'hidden',
    padding: 22,
    gap: 18,
    borderWidth: 1,
    borderRadius: 30,
  },
  watermark: {
    position: 'absolute',
    top: -12,
    right: -16,
    opacity: 0.12,
  },
  identitas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  monogram: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  inisial: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  teks: {
    flex: 1,
    gap: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeTeks: {
    fontWeight: '600',
  },
});
