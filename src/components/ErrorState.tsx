import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, useTheme } from '@/theme';

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
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>

      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.colors.primaryFill, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>{retryLabel}</Text>
        </Pressable>
      ) : null}

      {onSecondary && secondaryLabel ? (
        <Pressable
          onPress={onSecondary}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.secondaryText, { color: theme.colors.textSecondary }]}>
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
    gap: spacing.sm,
    padding: spacing.page,
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
    marginTop: spacing.sm,
    borderRadius: 12,
    paddingHorizontal: spacing.page,
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
    paddingHorizontal: spacing.page,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
