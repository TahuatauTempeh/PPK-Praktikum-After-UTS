// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'coverage/**',
      'android/**',
      'ios/**',
      '.codegraph/**',
      'expo-env.d.ts',
    ],
  },
  expoConfig,
  {
    rules: {
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'jest.setup.ts'],
    languageOptions: {
      globals: globals.jest,
    },
  },
]);
