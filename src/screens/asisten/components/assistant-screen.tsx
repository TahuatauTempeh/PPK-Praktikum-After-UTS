import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assistantTheme as theme } from '../theme';

export function AssistantScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: 600,
    flexGrow: 1,
    paddingHorizontal: theme.spacing.page,
    paddingTop: 14,
    paddingBottom: theme.spacing.page,
    gap: theme.spacing.section,
  },
});
