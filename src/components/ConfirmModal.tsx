/**
 * ConfirmModal — Modal konfirmasi reusable.
 * Menampilkan judul, pesan, dan dua tombol (batal + konfirmasi).
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                { backgroundColor: theme[confirmColor], opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{confirmText}</Text>
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
    paddingHorizontal: Spacing.four,
  },
  modalContent: {
    borderRadius: 20,
    padding: Spacing.four,
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
