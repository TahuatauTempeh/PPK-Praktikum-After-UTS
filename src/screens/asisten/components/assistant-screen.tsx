import type { PropsWithChildren, ReactNode, Ref, ComponentRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { assistantTheme as theme } from '../theme';
import { AssistantAtmosphere } from './assistant-atmosphere';

export function AssistantScreen({ children, footer, header, scrollRef, edges }: PropsWithChildren<{
  footer?: ReactNode; header?: ReactNode; scrollRef?: Ref<ComponentRef<typeof ScrollView>>; edges?: readonly Edge[];
}>) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <AssistantAtmosphere />
      {header ? <View style={styles.header}>{header}</View> : null}
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: theme.spacing.page, paddingTop: 14 },
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
