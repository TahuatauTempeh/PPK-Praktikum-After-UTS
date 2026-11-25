import { expect, test } from '../fixtures';
import {
  closeAdminDb,
  getAuditLogs,
  getLab,
  getLabByName,
  login,
  waitForAsistenHome,
  waitForPraktikanHome,
} from '../helpers';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.afterAll(async () => {
  await closeAdminDb();
});

test('[UAT-LAB-02] validasi koordinat dan radius', { tag: '@uat' }, async ({ page }) => {
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/lab/baru');

  await page.getByTestId('lab-nama').fill('Lab Valid');
  await page.getByTestId('lab-kode').fill('VALID');
  await page.getByTestId('lab-gedung').fill('Gedung A');
  await page.getByTestId('lab-ruang').fill('A101');
  await page.getByTestId('lab-latitude').fill('-120');
  await page.getByTestId('lab-longitude').fill('200');
  await page.getByTestId('lab-radius').fill('5');
  await page.getByTestId('lab-simpan').click();

  await expect(
    page.getByText('Latitude harus berupa angka antara -90 dan 90.'),
  ).toBeVisible();
  await expect(
    page.getByText('Longitude harus berupa angka antara -180 dan 180.'),
  ).toBeVisible();
  await expect(page.getByText(/Radius harus antara \d+ dan \d+ meter\./)).toBeVisible();
  expect(await getLabByName('Lab Valid')).toBeNull();
});

test('[UAT-LAB-03] gunakan lokasi saya', { tag: '@uat' }, async ({ page }) => {
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/lab/baru');

  await page.getByRole('button', { name: 'Gunakan lokasi saya' }).click();

  const latitude = page.getByTestId('lab-latitude');
  const longitude = page.getByTestId('lab-longitude');
  await expect(latitude).toHaveValue(/^-?\d+(?:\.\d+)?$/, { timeout: 30_000 });
  await expect(longitude).toHaveValue(/^-?\d+(?:\.\d+)?$/);
  await expect(page.getByText(/Koordinat diisi dari posisi perangkat/)).toBeVisible();

  await latitude.fill('-7.060000');
  await expect(latitude).toHaveValue('-7.060000');
});

test('[UAT-LAB-04] ubah nama dan radius', { tag: '@uat' }, async ({ page, scenario }) => {
  const originalName = `Lab ${scenario.prefix}`;
  const revisedName = 'Lab UAT Revisi';
  const auditBefore = (await getAuditLogs('laboratories', scenario.labId)).length;

  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/lab');
  await expect(page.getByText(originalName, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: `Ubah ${originalName}`, exact: true }).click();
  await expect(page.getByTestId('lab-nama')).toHaveValue(originalName);

  await page.getByTestId('lab-nama').fill(revisedName);
  await page.getByTestId('lab-radius').fill('120');
  await page.getByTestId('lab-simpan').click();

  await expect(page).toHaveURL(/\/asisten\/lab\/?$/);
  await expect(page.getByText(revisedName, { exact: true })).toBeVisible();
  await expect(page.getByText('Radius 120 m', { exact: true })).toBeVisible();
  await expect.poll(async () => (await getLab(scenario.labId))?.name).toBe(revisedName);
  await expect
    .poll(async () => (await getLab(scenario.labId))?.radiusMeters)
    .toBe(120);
  await expect
    .poll(async () => (await getAuditLogs('laboratories', scenario.labId)).length)
    .toBeGreaterThan(auditBefore);
});

test('[UAT-LAB-05] nonaktifkan lab', { tag: '@uat' }, async ({ page, scenario }) => {
  const labName = `Lab ${scenario.prefix}`;
  const secondLabName = `Lab ${scenario.prefix} 2`;

  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/lab');
  await expect(page.getByText(labName, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: `Nonaktifkan ${labName}`, exact: true }).click();
  await expect(page.getByText('Nonaktifkan laboratorium?')).toBeVisible();
  // Modal konfirmasi tidak punya role tombol; teks "Nonaktifkan" juga ada pada chip
  // kartu lab, sehingga konfirmasi dipilih dari elemen terakhir di portal modal.
  await page.getByText('Nonaktifkan', { exact: true }).last().click();
  await expect(page.getByText(`Laboratorium "${labName}" dinonaktifkan.`)).toBeVisible();
  await expect(page.getByRole('button', { name: `Aktifkan ${labName}`, exact: true })).toBeVisible();
  await expect.poll(async () => (await getLab(scenario.labId))?.isActive).toBe(false);

  await page.goto('/asisten/peta');
  await expect(
    page.getByRole('button', {
      name: new RegExp(`^${escapeRegExp(secondLabName)},`),
    }),
  ).toBeVisible();
  await expect(page.getByText(labName, { exact: true })).toHaveCount(0);

  await page.goto('/asisten/atur-sesi');
  await page.getByTestId('sesi-tambah').click();
  await expect(page.getByTestId(`sesi-lab-${scenario.secondLabId}`)).toBeVisible();
  await expect(page.getByTestId(`sesi-lab-${scenario.labId}`)).toHaveCount(0);

  // Helper logout mengarah ke /profil milik praktikan; profil asisten ada di
  // /asisten/profil, jadi logout dilakukan langsung di sini.
  await page.goto('/asisten/profil');
  await page.getByRole('button', { name: 'Keluar dari akun' }).click();
  await page.getByText('Ya', { exact: true }).click();
  await expect(page).toHaveURL(/\/login/);

  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.goto(`/praktikan/presensi/${scenario.openSessionId}`);
  await expect(
    page.getByText('Laboratorium sedang tidak aktif').first(),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Presensi sekarang' })).toBeDisabled();
});

test('[UAT-LAB-06] guard praktikan', { tag: '@uat' }, async ({ page }) => {
  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);

  await page.goto('/asisten/lab');

  await expect(page.getByText('Daftar sesi')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tambah laboratorium' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Ubah / })).toHaveCount(0);
});
