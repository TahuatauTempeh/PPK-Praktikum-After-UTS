import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { assistantTheme as theme } from '../theme';

/**
 * Latar halaman Asisten dan admin. Memakai aset gradien yang sama dengan
 * halaman Profil/Praktikan agar latar default seluruh halaman seragam.
 * Tema Asisten tetap terang, jadi varian gelap tidak dipakai di sini.
 */
export function AssistantAtmosphere() {
  return (
    <View pointerEvents="none" accessible={false} style={styles.background}>
      <Image source={require('../../../../assets/praktikan/atmosfer.svg')}
        contentFit="fill" style={styles.gradient} accessible={false} />
    </View>
  );
}

export function AssistantGlassHighlight() {
  return <Image source={require('../../../../assets/asisten/session-glass.svg')}
    contentFit="fill" style={styles.highlight} accessible={false} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: theme.colors.background },
  gradient: { position: 'absolute', top: 0, left: 0, width: '100%', height: 680 },
  highlight: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: theme.radius.card },
});
