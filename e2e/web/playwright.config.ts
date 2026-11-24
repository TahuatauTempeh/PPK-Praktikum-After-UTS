import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  outputDir: './test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  projects: [
    { name: 'critical', grep: /@critical/ },
    { name: 'full' },
  ],
  use: {
    baseURL: 'http://127.0.0.1:8081',
    navigationTimeout: 120_000,
    permissions: ['geolocation'],
    geolocation: { latitude: -7.0519, longitude: 110.4383, accuracy: 10 },
    timezoneId: 'Asia/Jakarta',
    locale: 'id-ID',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx expo start --web --port 8081 --clear',
    cwd: '../../',
    url: 'http://127.0.0.1:8081',
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      CI: '1',
      EXPO_NO_TELEMETRY: '1',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'demo-api-key',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-ppk-e2e.firebaseapp.com',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'demo-ppk-e2e',
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-ppk-e2e.appspot.com',
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      EXPO_PUBLIC_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000',
      EXPO_PUBLIC_FIREBASE_EMULATOR_HOST: '127.0.0.1',
    },
  },
});
