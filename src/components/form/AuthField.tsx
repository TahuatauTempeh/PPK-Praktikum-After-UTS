import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : theme.border,
          },
        ]}
      >
        <TextInput
          {...inputProps}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secure && !visible}
          autoCorrect={false}
          style={[styles.input, { color: theme.text }]}
        />

        {secure ? (
          <Pressable
            onPress={() => setVisible((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            <Text style={[styles.toggle, { color: theme.primary }]}>
              {visible ? 'Sembunyikan' : 'Lihat'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
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
    fontSize: 13,
    fontWeight: '700',
    paddingLeft: Spacing.two,
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
  },
});
