/**
 * Tombol: tombol aksi sisi praktikan. Tinggi minimal 48, melewati target sentuh 44.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Tipe, usePraktikanTheme } from '@/screens/praktikan/theme';

interface TombolProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Tombol({ label, onPress, variant = 'primary', disabled = false }: TombolProps) {
  const theme = usePraktikanTheme();
  const utama = variant === 'primary' && !disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.tombol,
        {
          backgroundColor: utama ? theme.primary : theme.neutralSoft,
          borderColor: utama ? theme.primary : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[Tipe.label, { color: utama ? theme.onPrimary : disabled ? theme.textSecondary : theme.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tombol: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
