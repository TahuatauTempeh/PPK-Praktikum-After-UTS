import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
}

export function ErrorState({
  title = 'Terjadi kesalahan',
  message,
  onRetry,
  retryLabel = 'Coba lagi',
  onSecondary,
  secondaryLabel,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.primaryFill, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.onPrimary }]}>{retryLabel}</Text>
        </Pressable>
      ) : null}

      {onSecondary && secondaryLabel ? (
        <Pressable
          onPress={onSecondary}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
