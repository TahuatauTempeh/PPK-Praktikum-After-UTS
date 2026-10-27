/**
 * SesiBerlangsung: kartu biru di atas daftar bila ada sesi dibuka yang belum dipresensi.
 * Ini satu-satunya aksi yang perlu ditindak praktikan, jadi dibuat paling menonjol.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tombol } from '@/screens/praktikan/components/tombol';
import { pecahJudul } from '@/screens/praktikan/selectors';
import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';
import { Session } from '@/types';

export function SesiBerlangsung({ session, onPress }: { session: Session; onPress: () => void }) {
  const theme = usePraktikanTheme();
  const { mataKuliah, sesi } = pecahJudul(session);

  return (
    <View style={[styles.kartu, { backgroundColor: theme.isiAksen }]}>
      <Text accessibilityRole="header" style={[Tipe.sectionTitle, { color: theme.diAtasAksen }]}>
        Presensi sedang dibuka
      </Text>
      <Text style={[Tipe.body, { color: theme.diAtasAksen }]}>
        {sesi ? `${mataKuliah}, ${sesi}` : mataKuliah}
      </Text>
      <View style={styles.aksi}>
        <Tombol label="Presensi sekarang" varian="terang" panah onPress={onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kartu: { borderRadius: 24, padding: 18, gap: 4 },
  aksi: { marginTop: 12 },
});
