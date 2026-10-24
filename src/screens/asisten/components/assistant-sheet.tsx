import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assistantTheme as theme } from '../theme';

type Props = { children: ReactNode; onCancel: () => void; onShow: () => void };

export function AssistantSheet({ children, onCancel, onShow }: Props) {
  return (
    <Modal visible transparent animationType="none" onRequestClose={onCancel} onShow={onShow}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup sheet" onPress={onCancel} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.frame} pointerEvents="box-none">
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} accessible={false} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {children}
            </ScrollView>
          </SafeAreaView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18,23,44,0.5)' },
  frame: { maxHeight: '92%', width: '100%', maxWidth: 600, alignSelf: 'center' },
  sheet: { flexShrink: 1, backgroundColor: theme.colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  content: { paddingBottom: 8 },
});
