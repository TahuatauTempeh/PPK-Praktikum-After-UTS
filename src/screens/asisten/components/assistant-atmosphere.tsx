import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { tokens, useTheme } from '@/theme';

const atmosfer = {
  light: require('../../../../assets/praktikan/atmosfer.svg'),
  dark: require('../../../../assets/praktikan/atmosfer-gelap.svg'),
};

const kilau = {
  light: require('../../../../assets/asisten/session-glass.svg'),
  dark: require('../../../../assets/asisten/session-glass-dark.svg'),
};

/**
 * Latar halaman Asisten dan admin. Memakai aset gradien yang sama dengan
 * halaman Profil/Praktikan agar latar default seluruh halaman seragam,
 * termasuk varian gelapnya.
 */
export function AssistantAtmosphere() {
  const theme = useTheme();

  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[styles.background, { backgroundColor: theme.colors.background }]}
    >
      <Image source={atmosfer[theme.scheme]}
        contentFit="fill" style={styles.gradient} accessible={false} />
    </View>
  );
}

export function AssistantGlassHighlight() {
  const theme = useTheme();

  return <Image source={kilau[theme.scheme]}
    contentFit="fill" style={styles.highlight} accessible={false} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  gradient: { position: 'absolute', top: 0, left: 0, width: '100%', height: 680 },
  highlight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: tokens.radius.card,
  },
});
