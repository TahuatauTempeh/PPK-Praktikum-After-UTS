/**
 * Latar: gradien kobalt di atas, memudar ke warna halaman. Dekoratif, tidak menerima sentuhan.
 */

import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { usePraktikanTheme } from '@/screens/praktikan/theme';

export function Latar() {
  const theme = usePraktikanTheme();
  const sumber =
    theme.mode === 'gelap'
      ? require('@/assets/praktikan/atmosfer-gelap.svg')
      : require('@/assets/praktikan/atmosfer.svg');

  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}
    >
      <Image source={sumber} contentFit="fill" style={styles.gradien} accessible={false} />
    </View>
  );
}

/** Kilau kaca di kartu sorotan; hanya di tema terang */
export function KilauKaca() {
  const theme = usePraktikanTheme();
  if (theme.mode === 'gelap') return null;
  return (
    <Image
      source={require('@/assets/praktikan/kaca.svg')}
      contentFit="fill"
      style={styles.kilau}
      accessible={false}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  gradien: { position: 'absolute', top: 0, left: 0, width: '100%', height: 680 },
  kilau: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 28 },
});
