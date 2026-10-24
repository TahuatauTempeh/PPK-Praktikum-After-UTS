import type { PropsWithChildren, ReactNode, Ref, ComponentRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assistantTheme as theme } from '../theme';

export function AssistantScreen({ children, footer, scrollRef }: PropsWithChildren<{ footer?: ReactNode; scrollRef?: Ref<ComponentRef<typeof ScrollView>> }>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
      {footer}
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
