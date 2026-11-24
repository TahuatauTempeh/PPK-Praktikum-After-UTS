import { expect, test } from '@playwright/test';

import {
  closeAdminDb,
  deleteAttendance,
  getAttendance,
  login,
  openPresensi,
  waitForPraktikanHome,
} from './helpers';

const SESSION_ID = 'e2e-session-open';
const UID = 'e2e-praktikan1';

test.describe('presensi web', () => {
  test.beforeEach(async () => {
    await deleteAttendance(SESSION_ID, UID);
  });

  test.afterAll(async () => {
    await closeAdminDb();
  });

  test('praktikan mencatat presensi di dalam radius', async ({ page }) => {
    await login(page, 'praktikan1@test.local');
    await waitForPraktikanHome(page);
    await openPresensi(page, SESSION_ID);

    const tombol = page.getByRole('button', { name: 'Presensi sekarang' });
    await expect(tombol).toBeEnabled({ timeout: 30_000 });
    await tombol.click();

    await expect(
      page.getByText('Konfirmasi presensi', { exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Ya, presensi sekarang' })
      .click();

    await expect(
      page.getByText('Presensi berhasil', { exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    const data = await getAttendance(SESSION_ID, UID);
    expect(data).not.toBeNull();
    if (!data) throw new Error('attendance tidak ditemukan');
    expect(data).toMatchObject({
      sessionId: SESSION_ID,
      userId: UID,
      userName: 'Praktikan Satu',
      userNim: '001',
      radiusMeters: 100,
      laboratoryId: 'e2e-lab',
      mocked: false,
      source: 'location',
    });
    expect(data?.accuracyMeters).toBeLessThanOrEqual(100);
    expect(data?.distanceMeters).toBeLessThanOrEqual(100);
    expect(data?.latitude).toBeCloseTo(-7.0519, 3);
    expect(data?.longitude).toBeCloseTo(110.4383, 3);
    expect(data?.recordedAt).toBeTruthy();
  });
});
