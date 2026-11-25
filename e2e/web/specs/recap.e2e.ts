import { expect, test } from '../fixtures';
import {
  closeAdminDb,
  getAttendance,
  getSession,
  login,
  seedAttendance,
  waitForAsistenHome,
} from '../helpers';

test.afterAll(async () => {
  await closeAdminDb();
});

test('[UAT-REG-05] buka, presensi, tutup, dan rekap', { tag: '@uat' }, async ({
  page,
  scenario,
}) => {
  const sessionId = scenario.scheduledSessionId;
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto(`/asisten/sesi/${sessionId}`);

  await page.getByTestId('sesi-buka').click();
  await page.getByRole('button', { name: /Ya, buka sesi/ }).click();
  await expect(page.getByText(/Sesi berhasil dibuka/)).toBeVisible();
  expect((await getSession(sessionId))?.status).toBe('open');

  await seedAttendance(sessionId, 'e2e-praktikan1', {
    laboratoryId: scenario.labId,
  });
  await page.getByTestId('sesi-tutup').click();
  await page.getByRole('button', { name: /Ya, tutup sesi/ }).click();
  await expect(page.getByText(/Sesi berhasil ditutup/)).toBeVisible();
  expect((await getSession(sessionId))?.status).toBe('closed');

  await page.goto(`/asisten/rekap?sesi=${sessionId}`);
  await expect(page.getByText('Rekap presensi')).toBeVisible();
  await expect(page.getByText('100% dari 1 praktikan')).toBeVisible();
  await expect(page.getByText('Tidak ada', { exact: true })).toBeVisible();

  const attendance = await getAttendance(sessionId, 'e2e-praktikan1');
  expect(attendance).toMatchObject({
    sessionId,
    userId: 'e2e-praktikan1',
    laboratoryId: scenario.labId,
    mocked: false,
    source: 'location',
  });
});

test('[extra] filter tanggal dan empty state rekap', { tag: '@uat' }, async ({ page }) => {
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/rekap');

  await page.getByRole('button', { name: /Filter tanggal/ }).click();
  await page.getByLabel('Tanggal awal').fill('2030-01-01');
  await page.getByLabel('Tanggal akhir').fill('2030-01-31');
  await page.getByRole('button', { name: 'Terapkan tanggal' }).click();
  await expect(page.getByText('Tidak ada rekap untuk filter ini')).toBeVisible();

  await page.goto('/asisten/rekap?sesi=tidak-ada');
  await expect(page.getByText('Tidak ada rekap untuk filter ini')).toBeVisible();
});
