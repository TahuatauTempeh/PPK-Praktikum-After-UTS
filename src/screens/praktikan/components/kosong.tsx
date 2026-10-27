/**
 * Kosong: state kosong dan galat ringan, dengan aksi opsional.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Ikon, IkonNama } from '@/screens/praktikan/components/ikon';
import { Tombol } from '@/screens/praktikan/components/tombol';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

interface KosongProps {
  ikon: IkonNama;
  judul: string;
  keterangan?: string;
  aksi?: { label: string; onPress: () => void };
}

export function Kosong({ ikon, judul, keterangan, aksi }: KosongProps) {
  const theme = usePraktikanTheme();

  return (
    <View style={styles.wadah}>
      <View style={[styles.ikon, { backgroundColor: theme.kartu, borderColor: theme.garisKartu }]}>
        <Ikon nama={ikon} ukuran={34} warna={theme.aksen} />
      </View>
      <Text accessibilityRole="header" style={[Tipe.judulKartu, styles.tengah, { color: theme.teks }]}>
        {judul}
      </Text>
      {keterangan ? (
        <Text style={[Tipe.body, styles.tengah, { color: theme.teksSekunder }]}>{keterangan}</Text>
      ) : null}
      {aksi ? (
        <View style={styles.aksi}>
          <Tombol label={aksi.label} onPress={aksi.onPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wadah: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 32, gap: 16 },
  ikon: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    borderWidth: 1,
  },
  tengah: { textAlign: 'center' },
  aksi: { alignSelf: 'stretch' },
});
