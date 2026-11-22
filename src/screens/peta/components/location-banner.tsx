/**
 * location-banner.tsx: banner informasi/peringatan untuk izin lokasi,
 * layanan lokasi nonaktif, fallback mode daftar, atau gagal memuat peta.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles, type Theme } from '@/theme';

export type BannerTone = 'info' | 'warning' | 'error';

export interface LocationBannerProps {
  tone?: BannerTone;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function LocationBanner({
  tone = 'warning',
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: LocationBannerProps) {
  const styles = useThemedStyles(createStyles);
  const isAlert = tone !== 'info';

  return (
    <View
      accessibilityRole={isAlert ? 'alert' : 'text'}
      style={[
        styles.banner,
        tone === 'error'
          ? styles.bannerError
          : tone === 'info'
            ? styles.bannerInfo
            : styles.bannerWarning,
      ]}
    >
      <Text
        style={[
          styles.message,
          tone === 'error' ? styles.messageError : styles.messageDefault,
        ]}
      >
        {message}
      </Text>

      {actionLabel && onAction ? (
        <View style={styles.actions}>
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
          >
            <Text style={styles.primaryActionText}>{actionLabel}</Text>
          </Pressable>

          {secondaryLabel && onSecondary ? (
            <Pressable
              onPress={onSecondary}
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryActionText}>{secondaryLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    banner: {
      borderRadius: theme.radius.control,
      borderWidth: 1,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    bannerInfo: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.border,
    },
    bannerWarning: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    bannerError: {
      backgroundColor: theme.colors.errorSoft,
      borderColor: theme.colors.error,
    },
    message: {
      ...theme.typography.caption,
    },
    messageDefault: {
      color: theme.colors.textPrimary,
    },
    messageError: {
      color: theme.colors.error,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    primaryAction: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.base,
      borderRadius: theme.radius.button,
      backgroundColor: theme.colors.primaryFill,
    },
    primaryActionText: {
      ...theme.typography.caption,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.onPrimary,
    },
    secondaryAction: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.base,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    secondaryActionText: {
      ...theme.typography.caption,
      fontFamily: theme.fonts.semibold,
      color: theme.colors.textPrimary,
    },
    pressed: {
      opacity: 0.8,
    },
  });
