import { test, expect } from '@playwright/test';

import {
  E2E_PASSWORD,
  closeAdminDb,
  getAdminDb,
  getDocByPath,
  login,
  logout,
  register,
  waitForAsistenHome,
  waitForPraktikanHome,
} from '../helpers';

test.afterAll(async () => {
  await getAdminDb()
    .collection('users')
    .doc('e2e-praktikan3')
    .update({ role: 'praktikan' });
  await closeAdminDb();
});

test('[UAT-REG-01] login, logout, dan guard peran', { tag: '@uat' }, async ({ page }) => {
  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);

  await page.goto('/asisten/lab');
  await expect(page.getByText('Daftar sesi')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tambah laboratorium' })).toHaveCount(0);

  await logout(page);
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);

  await page.goto('/praktikan/presensi/e2e-session-open');
  await expect(page.getByText('MENU', { exact: true })).toBeVisible();
});

test('[extra] registrasi praktikan baru', { tag: '@uat' }, async ({ page }) => {
  const email = `baru-${Date.now()}@test.local`;
  await register(page, { name: 'Praktikan Baru', nim: '999001', email });
  await waitForPraktikanHome(page);
  await expect(page.getByText('Daftar sesi')).toBeVisible();

  await logout(page);
  await login(page, email, E2E_PASSWORD);
  await waitForPraktikanHome(page);
});

test('[extra] admin promote dan demote', { tag: '@uat' }, async ({ page }) => {
  await login(page, 'admin@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/admin');
  await page.getByLabel('Cari pengguna').fill('Praktikan Tiga');

  await page
    .getByRole('button', { name: 'Jadikan Praktikan Tiga sebagai Asisten' })
    .click();
  await page.getByText('Ya, jadikan Asisten', { exact: true }).click();
  await expect
    .poll(async () => (await getDocByPath('users/e2e-praktikan3'))?.role)
    .toBe('asisten');

  await page
    .getByRole('button', { name: 'Jadikan Praktikan Tiga sebagai Praktikan' })
    .click();
  await page.getByText('Ya, jadikan Praktikan', { exact: true }).click();
  await expect
    .poll(async () => (await getDocByPath('users/e2e-praktikan3'))?.role)
    .toBe('praktikan');
});
