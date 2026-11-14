/**
 * SesiBerlangsung: kartu biru di atas daftar bila ada sesi dibuka yang belum dipresensi.
 * Ini satu-satunya aksi yang perlu ditindak praktikan, jadi dibuat paling menonjol.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tombol } from '@/screens/praktikan/components/tombol';
import { pecahJudul } from '@/screens/praktikan/selectors';
import { typography, useTheme } from '@/theme';
import { Session } from '@/types';

export function SesiBerlangsung({ session, onPress }: { session: Session; onPress: () => void }) {
  const theme = useTheme();
  const { mataKuliah, sesi } = pecahJudul(session);

  return (
    <View style={[styles.kartu, { backgroundColor: theme.colors.primaryFill }]}>
      <Text accessibilityRole="header" style={[typography.sectionTitle, { color: theme.colors.onPrimary }]}>
        Presensi sedang dibuka
      </Text>
      <Text style={[typography.body, { color: theme.colors.onPrimary }]}>
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
