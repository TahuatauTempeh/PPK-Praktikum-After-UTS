import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  Animated, Easing, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assistantTheme as theme } from '../theme';
import { AssistantGlassHighlight } from './assistant-atmosphere';

export type CloseSheet = (action?: () => void) => void;

type Props = {
  children: ReactNode | ((close: CloseSheet) => ReactNode);
  onCancel: () => void;
  onShow: () => void;
};

const AnimatedSheet = Animated.createAnimatedComponent(SafeAreaView);
const OPEN_DURATION = 260;
const CLOSE_DURATION = 220;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.9;

export function AssistantSheet({ children, onCancel, onShow }: Props) {
  const { height } = useWindowDimensions();
  const [translateY] = useState(() => new Animated.Value(height));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetHeight, setSheetHeight] = useState(0);
  const [closing, setClosing] = useState(false);

  const close = useCallback((action?: () => void) => {
    if (closing) return;
    setClosing(true);
    Animated.parallel([
      Animated.timing(translateY, { toValue: height, duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: CLOSE_DURATION, useNativeDriver: false }),
    ]).start(() => (action ?? onCancel)?.());
  }, [backdropOpacity, closing, height, onCancel, translateY]);

  const settle = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0, stiffness: 320, damping: 34, mass: 1, overshootClamping: true, useNativeDriver: false,
    }).start();
  }, [translateY]);

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_event, gesture) => {
      if (gesture.dy > 0) translateY.setValue(gesture.dy);
    },
    onPanResponderRelease: (_event, gesture) => {
      const limit = Math.min(DISMISS_DISTANCE, Math.max(64, sheetHeight * 0.2));
      if (gesture.dy > limit || gesture.vy > DISMISS_VELOCITY) close();
      else settle();
    },
    onPanResponderTerminate: () => settle(),
    onPanResponderTerminationRequest: () => false,
  }), [close, settle, sheetHeight, translateY]);

  const open = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: OPEN_DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: OPEN_DURATION, useNativeDriver: false }),
    ]).start();
  }, [backdropOpacity, translateY]);

  const content = typeof children === 'function' ? children(close) : children;

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => close()} onShow={() => { open(); onShow(); }}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: backdropOpacity }]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup sheet" onPress={() => close()} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.frame} pointerEvents="box-none">
          <AnimatedSheet
            edges={['bottom']}
            onAccessibilityEscape={() => close()}
            onLayout={event => setSheetHeight(event.nativeEvent.layout.height)}
            style={[styles.sheet, { transform: [{ translateY }] }]}>
            <AssistantGlassHighlight />
            <View style={styles.grabArea} hitSlop={{ top: 8, bottom: 10, left: 60, right: 60 }} {...pan.panHandlers}>
              <View style={styles.handle} accessible={false} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
              {content}
            </ScrollView>
          </AnimatedSheet>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(12,32,70,0.42)' },
  frame: { maxHeight: '92%', width: '100%', maxWidth: 600, alignSelf: 'center' },
  sheet: { flexShrink: 1, backgroundColor: '#F1F6FE', borderWidth: 1, borderColor: theme.colors.glassBorder, borderTopLeftRadius: theme.radius.panel, borderTopRightRadius: theme.radius.panel, overflow: 'hidden' },
  grabArea: { alignSelf: 'stretch', alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.colors.border },
  content: { paddingBottom: 8 },
});
