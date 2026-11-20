// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', 'coverage/*', 'android/*', 'ios/*'],
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
