/**
 * Toast — Notifikasi popup yang muncul di atas layar.
 * Auto-dismiss setelah 3 detik. Mendukung tipe: success, error, info.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/context/session-context';
import { useTheme } from '@/hooks/use-theme';

interface ToastProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
  onDismiss: () => void;
  duration?: number;
}

const toastConfig = {
  success: { icon: '✅', bgKey: 'successLight' as const, textKey: 'success' as const },
  error: { icon: '❌', bgKey: 'dangerLight' as const, textKey: 'danger' as const },
  info: { icon: 'ℹ️', bgKey: 'primaryLight' as const, textKey: 'primary' as const },
};

export function Toast({ visible, type, message, onDismiss, duration = 3000 }: ToastProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(-100));
  const [opacity] = useState(() => new Animated.Value(0));
  const config = toastConfig[type];

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [opacity, translateY, onDismiss]);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 120,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, handleDismiss, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        onPress={handleDismiss}
        style={[
          styles.toast,
          {
            backgroundColor: theme[config.bgKey],
            borderColor: theme[config.textKey],
          },
        ]}
      >
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={[styles.message, { color: theme[config.textKey] }]} numberOfLines={3}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── ToastContainer — wrapper yang baca dari context ─────────────────────────

export function ToastContainer() {
  const { toast, dismissToast } = useSession();

  if (!toast) return null;

  return (
    <Toast
      visible={!!toast}
      type={toast.type}
      message={toast.message}
      onDismiss={dismissToast}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    width: '100%',
    maxWidth: 500,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  icon: {
    fontSize: 18,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
});
