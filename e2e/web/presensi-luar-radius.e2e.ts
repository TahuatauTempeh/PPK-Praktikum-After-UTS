import { expect, test } from '@playwright/test';

import {
  closeAdminDb,
  getAttendance,
  login,
  openPresensi,
  waitForPraktikanHome,
} from './helpers';

const SESSION_ID = 'e2e-session-open-out';
const UID = 'e2e-praktikan2';

test.describe('presensi luar radius', () => {
  test.use({
    geolocation: { latitude: -7.25, longitude: 110.5, accuracy: 10 },
  });

  test.afterAll(async () => {
    await closeAdminDb();
  });

  test('menolak presensi di luar radius tanpa menulis dokumen', async ({
    page,
  }) => {
    await login(page, 'praktikan2@test.local');
    await waitForPraktikanHome(page);
    await openPresensi(page, SESSION_ID);

    await expect(page.getByRole('alert')).toContainText(
      /Kamu berada .*Radius yang diizinkan/,
    );
    await expect(
      page.getByRole('button', { name: 'Presensi sekarang' }),
    ).toBeDisabled();
    expect(await getAttendance(SESSION_ID, UID)).toBeNull();
  });
});
