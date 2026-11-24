import { expect, test } from '@playwright/test';

import {
  getSessionByTitle,
  loginAs,
  waitForAsistenHome,
} from '../helpers';

test('asisten menyiapkan lab dan siklus sesi', { tag: '@critical' }, async ({ page }) => {
  await loginAs(page, 'asisten@test.local');
  await waitForAsistenHome(page);

  await page.goto('/asisten/lab/baru');
  await page.getByTestId('lab-nama').fill('Lab Critical');
  await page.getByTestId('lab-kode').fill('CRT');
  await page.getByTestId('lab-gedung').fill('Gedung Critical');
  await page.getByTestId('lab-ruang').fill('C101');
  await page.getByTestId('lab-latitude').fill('-7.0519');
  await page.getByTestId('lab-longitude').fill('110.4383');
  await page.getByTestId('lab-radius').fill('100');
  await page.getByTestId('lab-simpan').click();
  await expect(page.getByText('Lab Critical')).toBeVisible();

  await page.goto('/asisten/atur-sesi');
  await page.getByTestId('sesi-tambah').click();
  await page.getByTestId('sesi-judul').fill('Praktikum Critical');
  await page.getByTestId('sesi-tanggal').fill('2026-11-24');
  await page.getByTestId('sesi-mulai').fill('08:00');
  await page.getByTestId('sesi-selesai').fill('10:00');
  await page.getByRole('button', { name: /Laboratorium Lab Critical/ }).click();
  await page.getByTestId('sesi-ruangan').fill('A201');
  await page.getByTestId('sesi-simpan').click();
  await expect(page.getByText('Praktikum Critical', { exact: true })).toBeVisible();

  const session = await getSessionByTitle('Praktikum Critical');
  expect(session).toBeTruthy();
  await page.goto(`/asisten/sesi/${session?.id ?? ''}`);

  await page.getByTestId('sesi-buka').click();
  await page.getByRole('button', { name: 'Ya, buka sesi' }).click();
  await expect(page.getByText(/Sesi berhasil dibuka\./)).toBeVisible();
  expect((await getSessionByTitle('Praktikum Critical'))?.status).toBe('open');

  await page.getByTestId('sesi-tutup').click();
  await page.getByRole('button', { name: 'Ya, tutup sesi' }).click();
  await expect(page.getByText(/Sesi berhasil ditutup\./)).toBeVisible();
  expect((await getSessionByTitle('Praktikum Critical'))?.status).toBe('closed');
});
