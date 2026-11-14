import type { PropsWithChildren, ReactNode, Ref, ComponentRef } from 'react';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { assistantTheme as theme } from '../theme';
import { AssistantAtmosphere } from './assistant-atmosphere';

type SurfaceProps = PropsWithChildren<{
  footer?: ReactNode; header?: ReactNode; edges?: readonly Edge[];
}>;

/**
 * Kerangka layar Asisten tanpa area gulir. Dipakai layar yang membawa daftar
 * sendiri, seperti FlatList di halaman admin, agar virtualisasi tetap jalan.
 */
export function AssistantSurface({ children, footer, header, edges }: SurfaceProps) {
  const focused = useIsFocused();

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {focused ? <StatusBar style="light" /> : null}
      <AssistantAtmosphere />
      {header ? <View style={styles.header}>{header}</View> : null}
      {children}
      {footer}
    </SafeAreaView>
  );
}

export function AssistantScreen({ children, footer, header, scrollRef, edges }: PropsWithChildren<{
  footer?: ReactNode; header?: ReactNode; scrollRef?: Ref<ComponentRef<typeof ScrollView>>; edges?: readonly Edge[];
}>) {
  return (
    <AssistantSurface header={header} footer={footer} edges={edges}>
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </AssistantSurface>
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
