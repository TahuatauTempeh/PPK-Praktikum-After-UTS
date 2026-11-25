import { expect, test } from '../fixtures';
import {
  getKesan,
  getSession,
  login,
  logout,
  seedAttendance,
  setSessionStatus,
  waitForAsistenHome,
  waitForPraktikanHome,
} from '../helpers';

test('[extra] kirim kesan pesan dan tampil di asisten', { tag: '@uat' }, async ({
  page,
  scenario,
}) => {
  const teks = 'Praktikum berjalan jelas dan asisten membantu.';

  await seedAttendance(scenario.closedSessionId, 'e2e-praktikan1', {
    laboratoryId: scenario.labId,
  });
  await setSessionStatus(scenario.closedSessionId, 'closed');
  expect((await getSession(scenario.closedSessionId))?.status).toBe('closed');

  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
  await page.goto(`/praktikan/sesi/${scenario.closedSessionId}`);
  await page.getByRole('button', { name: 'Tulis kesan pesan' }).click();
  await page.getByTestId('kesan-alasan').fill(teks);
  await page.getByTestId('kesan-kirim').click();
  await expect(page.getByText('Kesan dan pesan kamu')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(teks, { exact: true })).toBeVisible();

  await expect
    .poll(async () => (await getKesan(scenario.closedSessionId, 'e2e-praktikan1'))?.text)
    .toBe(teks);
  const tersimpan = await getKesan(scenario.closedSessionId, 'e2e-praktikan1');
  expect(tersimpan).toMatchObject({ sessionId: scenario.closedSessionId, text: teks });
  expect(['positif', 'netral', 'negatif', null]).toContain(tersimpan?.aiLabel);

  await logout(page);
  await login(page, 'asisten@test.local');
  await waitForAsistenHome(page);
  await page.goto('/asisten/kesan-pesan');
  // Data seed juga punya tombol yang sama; pilih sesi skenario lewat prefix uniknya.
  await page
    .getByRole('button', { name: new RegExp(`^Lihat kesan pesan .*${scenario.prefix}`) })
    .click();
  await expect(page.getByText(teks, { exact: true })).toBeVisible();
});
