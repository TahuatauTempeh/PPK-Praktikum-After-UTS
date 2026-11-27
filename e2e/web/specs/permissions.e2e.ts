import { expect, test } from '../fixtures';
import {
  getPermissionByReason,
  login,
  logout,
  waitForAsistenHome,
  waitForPraktikanHome,
} from '../helpers';

test('[UAT-REG-06] tolak izin dan kunci setelah review', { tag: '@uat' }, async ({
  page,
  scenario,
}) => {
  const reason = `Sakit dan perlu istirahat ${Date.now()}.`;

  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.goto('/izin');
  await page.getByTestId('izin-sesi').click();
  await page.getByTestId(`izin-sesi-${scenario.openSessionId}`).click();
  await page.getByTestId('izin-alasan').fill(reason);
  await page.getByTestId('izin-kirim').click();
  await expect(page.getByText(/Izin terkirim/)).toBeVisible({ timeout: 30_000 });

  await logout(page);
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/izin');
  await page.getByRole('button', { name: /Tinjau izin Praktikan Satu/ }).click();
  await page.getByTestId('izin-tolak').click();
  await page.getByText('Ya, tolak izin', { exact: true }).click();
  await expect(page.getByText('Izin ditolak.', { exact: true })).toBeVisible();

  const data = await getPermissionByReason(reason);
  expect(data).toMatchObject({ status: 'rejected', reviewedBy: 'e2e-asisten' });
  expect(data?.reviewedAt).toBeTruthy();

  // Helper logout memakai /profil (rute praktikan); profil asisten ada di
  // /asisten/profil, jadi ulangi langkah konfirmasi yang sama di sini.
  await page.goto('/asisten/profil');
  await page.getByRole('button', { name: 'Keluar dari akun' }).click();
  await page.getByText('Ya', { exact: true }).click();
  await expect(page).toHaveURL(/\/login/);

  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.goto('/izin');
  await page.getByTestId('izin-sesi').click();
  const chip = page.getByTestId(`izin-sesi-${scenario.openSessionId}`);
  await expect(chip).toContainText('Izin sudah diajukan');
  await expect(chip).toBeDisabled();
});

test('[extra] izin terkirim tanpa analisis AI', { tag: '@uat' }, async ({ page, scenario }) => {
  const reason = `Alasan yang jelas untuk UAT izin tanpa AI ${Date.now()}.`;

  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.goto('/izin');
  await page.getByTestId('izin-sesi').click();
  await page.getByTestId(`izin-sesi-${scenario.openSessionId}`).click();
  await page.getByTestId('izin-alasan').fill(reason);
  await page.getByTestId('izin-kirim').click();

  await expect(page.getByText(/Izin terkirim/)).toBeVisible({ timeout: 30_000 });

  // AI hanya dipakai di kesan pesan, jadi kartu izin tidak boleh menampilkan hasil AI.
  const kartu = page.getByText(reason, { exact: true }).locator('xpath=..');
  await expect(kartu).toBeVisible({ timeout: 30_000 });
  await expect(kartu.getByText(/Analisis AI|Hasil AI tidak tersedia/)).toHaveCount(0);
});
