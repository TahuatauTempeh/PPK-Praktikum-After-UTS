/**
 * ConfirmModal — Modal konfirmasi reusable.
 * Menampilkan judul, pesan, dan dua tombol (batal + konfirmasi).
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, useTheme } from '@/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const theme = useTheme();
  const confirmBackground =
    confirmColor === 'danger'
      ? theme.colors.errorFill
      : confirmColor === 'success'
        ? theme.colors.successFill
        : theme.colors.primaryFill;
  const confirmForeground =
    confirmColor === 'danger'
      ? theme.colors.onError
      : confirmColor === 'success'
        ? theme.colors.onSuccess
        : theme.colors.onPrimary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessible={false}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                { backgroundColor: theme.colors.primarySoft, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.colors.primary }]}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmBackground, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: confirmForeground }]}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
  },
  modalContent: {
    borderRadius: 20,
    padding: spacing.page,
    width: '100%',
    maxWidth: 400,
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {},
  confirmButton: {},
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
