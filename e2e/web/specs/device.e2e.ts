import { expect, test } from '../fixtures';
import { login, waitForPraktikanHome } from '../helpers';

test('[UAT-DEV-06] CDN Leaflet diblokir', { tag: '@uat' }, async ({
  page,
  scenario,
}) => {
  await page.route('**unpkg.com/**', (route) => route.abort());

  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.goto('/peta');
  // Web default adalah mode daftar; peta baru dimuat setelah tombol ini.
  await page.getByRole('button', { name: 'Tampilkan peta' }).click();

  await expect(
    page.getByText('Peta gagal dimuat. Menampilkan mode daftar laboratorium.'),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(`Lab ${scenario.prefix}`, { exact: true })).toBeVisible();
});
