import { expect, test } from '../fixtures';
import {
  closeAdminDb,
  getAuditLogs,
  getClass,
  getClassByName,
  getEnrollment,
  login,
  waitForAsistenHome,
} from '../helpers';

test.afterAll(async () => {
  await closeAdminDb();
});

test('[UAT-REG-02] CRUD kelas dan audit', { tag: '@uat' }, async ({ page }) => {
  const name = `Kelas UAT ${Date.now()}`;
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/kelas');

  await page.getByRole('button', { name: 'Tambah kelas' }).click();
  await page.getByTestId('kelas-nama').fill(name);
  await page.getByTestId('kelas-deskripsi').fill('Kelas untuk UAT');
  await page.getByTestId('kelas-simpan').click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  const created = await getClassByName(name);
  expect(created).toBeTruthy();
  if (!created) throw new Error('kelas tidak ditemukan');

  await page.getByTestId(`kelas-edit-${created.id}`).click();
  await page.getByTestId('kelas-nama').fill(`${name} Revisi`);
  await page.getByTestId('kelas-simpan').click();
  await expect(page.getByText(`${name} Revisi`, { exact: true })).toBeVisible();
  await expect.poll(async () => (await getClass(created.id))?.name).toBe(`${name} Revisi`);

  await page.getByTestId(`kelas-hapus-${created.id}`).click();
  await page.getByRole('button', { name: 'Ya, hapus kelas' }).click();
  await expect(page.getByText(`${name} Revisi`, { exact: true })).toHaveCount(0);
  await expect.poll(async () => await getClass(created.id)).toBeNull();

  const logs = await getAuditLogs('classes', created.id);
  expect(logs.length).toBeGreaterThanOrEqual(3);
});

test('[UAT-REG-03] tambah, hapus, dan cegah duplikat peserta', { tag: '@uat' }, async ({
  page,
  scenario,
}) => {
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);

  await page.goto(`/asisten/peserta?classId=${scenario.classId}`);
  await page.getByRole('button', { name: 'Tambah peserta' }).click();
  await page.getByLabel('Cari praktikan').fill('Praktikan Tiga');
  await page.getByTestId('peserta-pilih-e2e-praktikan3').click();
  await page.getByTestId('peserta-simpan').click();
  await expect(page.getByRole('dialog', { name: 'Tambah peserta' })).toHaveCount(0);
  await expect(page.getByText('Praktikan Tiga', { exact: true })).toBeVisible();

  const enrollmentId = `${scenario.classId}_e2e-praktikan3`;
  await expect.poll(async () => await getEnrollment(enrollmentId)).not.toBeNull();

  await page.getByRole('button', { name: 'Tambah peserta' }).click();
  await page.getByLabel('Cari praktikan').fill('Praktikan Tiga');
  await expect(page.getByTestId('peserta-pilih-e2e-praktikan3')).toHaveCount(0);
  await expect(
    page.getByText('Tidak ada praktikan yang cocok dengan pencarian.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Batal' }).click();
  await expect(page.getByRole('dialog', { name: 'Tambah peserta' })).toHaveCount(0);
  expect(await getEnrollment(enrollmentId)).not.toBeNull();

  await page.getByTestId(`peserta-hapus-${enrollmentId}`).click();
  await page.getByRole('button', { name: 'Ya, keluarkan peserta' }).click();
  await expect(page.getByText('Praktikan Tiga', { exact: true })).toHaveCount(0);
  await expect.poll(async () => await getEnrollment(enrollmentId)).toBeNull();
});
