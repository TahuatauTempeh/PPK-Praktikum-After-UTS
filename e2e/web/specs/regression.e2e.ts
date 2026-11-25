import { expect, test } from '../fixtures';
import { login, waitForPraktikanHome } from '../helpers';

test('[UAT-REG-07] tema terang dan gelap tetap terbaca', { tag: '@uat' }, async ({
  page,
}) => {
  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.goto('/profil');

  await page.getByRole('radio', { name: 'Tema gelap' }).click();
  await expect(page.getByText('Tema', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keluar dari akun' })).toBeVisible();

  await page.getByRole('radio', { name: 'Tema terang' }).click();
  await expect(page.getByText('Tema', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keluar dari akun' })).toBeVisible();
});

test('[UAT-NOT-10][UAT-DEV-05] web tidak mendukung notifikasi', { tag: '@uat' }, async ({
  page,
}) => {
  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.goto('/profil');
  await expect(page.getByText('Tidak didukung', { exact: true })).toBeVisible();
});

test('[UAT-DEV-08] sesi login bertahan setelah reload', { tag: '@uat' }, async ({ page }) => {
  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.reload();
  await expect(page.getByText('Daftar sesi')).toBeVisible();
});
