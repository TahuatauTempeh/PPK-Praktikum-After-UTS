import { expect, test } from '../fixtures';
import {
  getAuditLogs,
  getSession,
  getSessionByTitle,
  login,
  waitForAsistenHome,
} from '../helpers';

test('[UAT-REG-04] ubah dan hapus sesi', { tag: '@uat' }, async ({ page, scenario }) => {
  const title = `Sesi UAT ${Date.now()}`;
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/atur-sesi');

  await page.getByTestId('sesi-tambah').click();
  await page.getByTestId('sesi-judul').fill(title);
  await page.getByTestId('sesi-tanggal').fill(scenario.date);
  await page.getByTestId('sesi-mulai').fill('08:00');
  await page.getByTestId('sesi-selesai').fill('10:00');
  await page.getByTestId(`sesi-lab-${scenario.labId}`).click();
  await page.getByTestId('sesi-ruangan').fill('A201');
  await page.getByTestId('sesi-simpan').click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();

  const created = await getSessionByTitle(title);
  if (!created) throw new Error('sesi tidak ditemukan');

  await page.goto('/asisten/atur-sesi');
  await page.getByTestId(`sesi-edit-${created.id}`).click();
  await page.getByTestId('sesi-judul').fill(`${title} Revisi`);
  await page.getByTestId('sesi-simpan').click();
  await expect
    .poll(async () => (await getSession(created.id))?.title)
    .toBe(`${title} Revisi`);

  await page.getByTestId(`sesi-hapus-${created.id}`).click();
  await page.getByRole('button', { name: 'Ya, hapus sesi' }).click();
  await expect.poll(async () => await getSession(created.id)).toBeNull();
  await expect
    .poll(async () => (await getAuditLogs('sessions', created.id)).length)
    .toBeGreaterThanOrEqual(3);
});

test('[UAT-LAB-07] form sesi menolak laboratorium kosong', { tag: '@uat' }, async ({
  page,
  scenario,
}) => {
  const title = `Sesi Tanpa Lab ${Date.now()}`;
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/atur-sesi');
  await page.getByTestId('sesi-tambah').click();
  await page.getByTestId('sesi-judul').fill(title);
  await page.getByTestId('sesi-tanggal').fill(scenario.date);
  await page.getByTestId('sesi-mulai').fill('08:00');
  await page.getByTestId('sesi-selesai').fill('10:00');
  await page.getByTestId('sesi-ruangan').fill('A201');
  await page.getByTestId('sesi-simpan').click();

  await expect(page.getByText('Pilih laboratorium.')).toBeVisible();
  expect(await getSessionByTitle(title)).toBeNull();
});

test('[UAT-LAB-08] buka sesi tanpa lab ditolak', { tag: '@uat' }, async ({ page, scenario }) => {
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto(`/asisten/sesi/${scenario.scheduledNoLabSessionId}`);
  await page.getByTestId('sesi-buka').click();
  await page.getByRole('button', { name: /Ya, buka sesi/ }).click();

  await expect(page.getByText('Lengkapi laboratorium sesi terlebih dahulu.')).toBeVisible();
  expect((await getSession(scenario.scheduledNoLabSessionId))?.status).toBe('scheduled');
});

test('[extra] transisi sesi tidak valid', { tag: '@uat' }, async ({ page, scenario }) => {
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);

  await page.goto(`/asisten/sesi/${scenario.scheduledSessionId}`);
  await expect(page.getByTestId('sesi-tutup')).toHaveCount(0);
  expect((await getSession(scenario.scheduledSessionId))?.status).toBe('scheduled');

  await page.goto(`/asisten/sesi/${scenario.closedSessionId}`);
  await expect(page.getByTestId('sesi-buka')).toHaveCount(0);
  expect((await getSession(scenario.closedSessionId))?.status).toBe('closed');
});
