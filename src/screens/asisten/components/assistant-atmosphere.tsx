import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { assistantTheme as theme } from '../theme';

/** Lapisan dekoratif bersama; tidak menerima sentuhan atau fokus. */
export function AssistantAtmosphere() {
  return (
    <View pointerEvents="none" accessible={false} style={styles.background}>
      <Image source={require('../../../../assets/asisten/schedule-atmosphere.svg')}
        contentFit="fill" style={styles.light} accessible={false} />
    </View>
  );
}

export function AssistantGlassHighlight() {
  return <Image source={require('../../../../assets/asisten/session-glass.svg')}
    contentFit="fill" style={styles.highlight} accessible={false} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  background: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: theme.colors.background },
  light: { position: 'absolute', top: 0, left: 0, width: '100%', height: 680 },
  highlight: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: theme.radius.card },
});
