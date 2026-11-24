import { expect, test } from '@playwright/test';

import {
  getPermissionByReason,
  loginAs,
  logout,
  waitForAsistenHome,
  waitForPraktikanHome,
} from '../helpers';

test('praktikan mengajukan izin dan asisten menerima', { tag: '@critical' }, async ({ page }) => {
  const reason = `Sakit dan perlu istirahat ${Date.now()}.`;

  await loginAs(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.goto('/izin');
  await expect(page.getByText('Ajukan izin', { exact: true })).toBeVisible();
  await page.getByTestId('izin-sesi').click();
  await page.getByTestId('izin-sesi-e2e-session-open-out').click();
  await page.getByTestId('izin-alasan').fill(reason);
  await page.getByTestId('izin-kirim').click();
  await expect(page.getByText(/Izin terkirim/)).toBeVisible({ timeout: 30_000 });

  await logout(page);
  await loginAs(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/izin');
  await page.getByRole('button', { name: /Tinjau izin Praktikan Satu/ }).click();
  await page.getByTestId('izin-terima').click();
  await page.getByText('Ya, terima izin', { exact: true }).click();
  await expect(page.getByText('Izin diterima.', { exact: true })).toBeVisible();

  expect((await getPermissionByReason(reason))?.status).toBe('approved');
});
