import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
  validateLoginInput,
  type AuthFieldErrors,
} from '@/lib/validation/auth';
import { useTheme } from '@/theme';

import { authStyles } from '@/components/form/auth-styles';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const nextErrors = validateLoginInput(email, password);
    setErrors(nextErrors);
    setFormError(null);

    if (hasFieldErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setFormError(mapFirebaseError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[authStyles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={authStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
          <Text style={[authStyles.title, { color: theme.colors.textPrimary }]}>Masuk</Text>
          <Text style={[authStyles.subtitle, { color: theme.colors.textSecondary }]}>
            Presensi Praktikum
          </Text>

          <View style={authStyles.form}>
            <AuthField
              label="Email"
              testID="login-email"
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
              testID="login-password"
              value={password}
              onChangeText={setPassword}
              secure
              autoComplete="password"
              textContentType="password"
              placeholder="Minimal 6 karakter"
              error={errors.password}
            />
          </View>

          {formError ? (
            <Text style={[authStyles.formError, { color: theme.colors.error }]}>{formError}</Text>
          ) : null}

          <Pressable
            testID="login-submit"
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={submitting ? 'Memproses' : 'Masuk'}
            accessibilityState={{ busy: submitting, disabled: submitting }}
            style={({ pressed }) => [
              authStyles.button,
              {
                backgroundColor: theme.colors.primaryFill,
                opacity: submitting ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {submitting ? (
              <View style={authStyles.buttonBusy}>
                <ActivityIndicator color={theme.colors.onPrimary} />
              </View>
            ) : (
              <Text style={[authStyles.buttonText, { color: theme.colors.onPrimary }]}>
                Masuk
              </Text>
            )}
          </Pressable>

          <View style={authStyles.footer}>
            <Text style={[authStyles.footerText, { color: theme.colors.textSecondary }]}>
              Belum punya akun?{' '}
            </Text>
            <Link href="/register" style={[authStyles.link, { color: theme.colors.primary }]}>
              Daftar
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
