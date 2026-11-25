import { expect, test } from '@playwright/test';

import { getAttendance, login, waitForAsistenHome } from '../helpers';

test('asisten melihat kehadiran pada sesi tertutup', { tag: '@critical' }, async ({ page }) => {
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);

  await page.goto('/asisten/sesi/e2e-session-closed');

  await expect(
    page.getByText('Kelola sesi', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Hasil presensi', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Praktikan Satu', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('001', { exact: true })).toBeVisible();
  await expect(page.getByText('Hadir', { exact: true })).toBeVisible();

  const attendance = await getAttendance('e2e-session-closed', 'e2e-praktikan1');
  expect(attendance).toMatchObject({
    sessionId: 'e2e-session-closed',
    userId: 'e2e-praktikan1',
    laboratoryId: 'e2e-lab',
    source: 'location',
    mocked: false,
  });
  expect(attendance?.latitude).toBeCloseTo(-7.0519, 3);
  expect(attendance?.longitude).toBeCloseTo(110.4383, 3);
});
