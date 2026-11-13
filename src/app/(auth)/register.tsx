import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField } from '@/components/form/AuthField';
import { useAuth } from '@/context/auth-context';
import { mapFirebaseError } from '@/lib/firebase/errors';
import {
  hasFieldErrors,
  validateRegisterInput,
  type AuthFieldErrors,
} from '@/lib/validation/auth';
import type { RegisterInput } from '@/types';
import { useTheme } from '@/hooks/use-theme';

import { authStyles } from '@/components/form/auth-styles';

export default function RegisterScreen() {
  const theme = useTheme();
  const { registerPraktikan } = useAuth();
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const input: RegisterInput = { name, nim, email, password, confirmPassword };
    const nextErrors = validateRegisterInput(input);
    setErrors(nextErrors);
    setFormError(null);

    if (hasFieldErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await registerPraktikan(input);
    } catch (error) {
      setFormError(mapFirebaseError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[authStyles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={authStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
          <Text style={[authStyles.title, { color: theme.text }]}>Daftar</Text>
          <Text style={[authStyles.subtitle, { color: theme.textSecondary }]}>
            Buat akun praktikan
          </Text>

          <View style={authStyles.form}>
            <AuthField
              label="Nama lengkap"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              textContentType="name"
              placeholder="Nama sesuai absen"
              error={errors.name}
            />
            <AuthField
              label="NIM"
              value={nim}
              onChangeText={setNim}
              keyboardType="number-pad"
              autoCapitalize="none"
              placeholder="Contoh: 231511001"
              error={errors.nim}
            />
            <AuthField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="nama@email.com"
              error={errors.email}
            />
            <AuthField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secure
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Minimal 6 karakter"
              error={errors.password}
            />
            <AuthField
              label="Konfirmasi password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Ulangi password"
              error={errors.confirmPassword}
            />
          </View>

          {formError ? (
            <Text style={[authStyles.formError, { color: theme.danger }]}>{formError}</Text>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            style={({ pressed }) => [
              authStyles.button,
              {
                backgroundColor: theme.primary,
                opacity: submitting ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={authStyles.buttonText}>{submitting ? 'Memproses...' : 'Daftar'}</Text>
          </Pressable>

          <View style={authStyles.footer}>
            <Text style={[authStyles.footerText, { color: theme.textSecondary }]}>
              Sudah punya akun?{' '}
            </Text>
            <Link href="/login" style={[authStyles.link, { color: theme.primary }]}>
              Masuk
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
