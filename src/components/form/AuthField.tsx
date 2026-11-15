import React, { useState } from 'react';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { spacing, useTheme } from '@/theme';

type SymbolName = Extract<SymbolViewProps['name'], object>;

const EYE: SymbolName = { ios: 'eye', android: 'visibility', web: 'visibility' };
const EYE_OFF: SymbolName = { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' };

interface AuthFieldProps
  extends Pick<
    TextInputProps,
    | 'value'
    | 'onChangeText'
    | 'keyboardType'
    | 'autoCapitalize'
    | 'autoComplete'
    | 'textContentType'
    | 'returnKeyType'
    | 'onSubmitEditing'
  > {
  label: string;
  error?: string;
  secure?: boolean;
  placeholder?: string;
}

export function AuthField({
  label,
  error,
  secure = false,
  placeholder,
  ...inputProps
}: AuthFieldProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textPrimary }]}>{label}</Text>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
          },
        ]}
      >
        <TextInput
          {...inputProps}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={secure && !visible}
          autoCorrect={false}
          style={[styles.input, { color: theme.colors.textPrimary }]}
        />

        {secure ? (
          <Pressable
            onPress={() => setVisible((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Sembunyikan password' : 'Tampilkan password'}
            style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
          >
            <SymbolView
              name={visible ? EYE_OFF : EYE}
              size={20}
              tintColor={theme.colors.primary}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  toggle: {
    minWidth: 44,
    minHeight: 44,
    marginLeft: spacing.sm,
    // Geser ke kanan supaya tepi ikon rata dengan padding kanan field.
    marginRight: -12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  togglePressed: {
    opacity: 0.6,
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
  },
});
