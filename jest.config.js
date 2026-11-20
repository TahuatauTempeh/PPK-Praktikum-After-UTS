const preset = require('jest-expo/jest-preset');

/**
 * jest-expo sudah menangani transform React Native/Expo dan mapping `@/`
 * dari tsconfig. Tambahan di sini hanya dua hal yang tidak dicakup preset:
 * stub untuk import CSS dan urutan mapping aset sebelum mapping `@/`.
 */
module.exports = {
  ...preset,
  clearMocks: true,
  passWithNoTests: false,
  restoreMocks: true,
  setupFilesAfterEnv: [
    ...(preset.setupFilesAfterEnv ?? []),
    '<rootDir>/jest.setup.ts',
  ],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/style-mock.js',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    ...(preset.moduleNameMapper ?? {}),
  },
};
