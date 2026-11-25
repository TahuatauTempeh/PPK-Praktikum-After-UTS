import type { Page } from '@playwright/test';

import { currentTimeRange } from '../../shared/world';
import { expect, test } from '../fixtures';
import {
  closeAdminDb,
  getAdminDb,
  getSession,
  login,
  setLabActive,
  setSessionStatus,
  waitForPraktikanHome,
} from '../helpers';

const FALLBACK_TEXT = 'Peta gagal dimuat. Menampilkan mode daftar laboratorium.';

test.afterAll(async () => {
  await closeAdminDb();
});

test('[UAT-MAP-04] panel Sekarang', { tag: '@uat' }, async ({ page, scenario }) => {
  const labName = `Lab ${scenario.prefix}`;
  const session = await getSession(scenario.openSessionId);
  if (!session) throw new Error('Sesi open skenario tidak ditemukan.');

  await loginPraktikan(page);
  const card = await openLabOnMap(page, labName);
  const range = wibRange(String(session.startTime), String(session.endTime));

  await expect(card.getByText('SEKARANG', { exact: true })).toBeVisible();
  await expect(card.getByText(String(session.title), { exact: true })).toBeVisible();
  await expect(
    card.getByText(new RegExp(`Kelas ${escapeRegExp(scenario.prefix)}`)).first(),
  ).toBeVisible();
  await expect(card.getByText(range).first()).toBeVisible();
  await expect(card.getByText('Dibuka', { exact: true })).toBeVisible();
});

test('[UAT-MAP-05] panel Berikutnya', { tag: '@uat' }, async ({ page, scenario }) => {
  const labName = `Lab ${scenario.prefix}`;
  const scheduled = await getSession(scenario.scheduledSessionId);
  if (!scheduled) throw new Error('Sesi terjadwal skenario tidak ditemukan.');

  await loginPraktikan(page);
  const card = await openLabOnMap(page, labName);
  const range = wibRange(String(scheduled.startTime), String(scheduled.endTime));

  await expect(card.getByText('BERIKUTNYA', { exact: true })).toBeVisible();
  await expect(card.getByText(String(scheduled.title), { exact: true })).toBeVisible();
  await expect(card.getByText('Belum dibuka', { exact: true })).toBeVisible();
  await expect(card.getByText(range).last()).toBeVisible();
});

test('[UAT-MAP-06] lab tanpa sesi', { tag: '@uat' }, async ({ page, scenario }) => {
  const secondLabName = `Lab ${scenario.prefix} 2`;

  await loginPraktikan(page);
  const card = await openLabOnMap(page, secondLabName);

  await expect(card.getByText('Belum ada praktikum terjadwal', { exact: true })).toBeVisible();
  await expect(card.getByText('SEKARANG', { exact: true })).toHaveCount(0);
});

test('[UAT-MAP-07] update jadwal realtime', { tag: '@uat' }, async ({
  page,
  scenario,
}) => {
  const labName = `Lab ${scenario.prefix}`;
  const scheduled = await getSession(scenario.scheduledSessionId);
  if (!scheduled) throw new Error('Sesi terjadwal skenario tidak ditemukan.');

  await loginPraktikan(page);
  const card = await openLabOnMap(page, labName);
  const initialRange = wibRange(
    String(scheduled.startTime),
    String(scheduled.endTime),
  );
  await expect(card.getByText(initialRange).last()).toBeVisible();

  await getAdminDb()
    .collection('sessions')
    .doc(scenario.scheduledSessionId)
    .update({ startTime: '10:00', endTime: '12:00' });

  await expect(card.getByText('10.00–12.00 WIB').last()).toBeVisible({
    timeout: 2_000,
  });
});

test('[UAT-MAP-08] buka tutup sesi realtime', { tag: '@uat' }, async ({
  page,
  scenario,
}) => {
  const secondLabName = `Lab ${scenario.prefix} 2`;
  const realtimeSessionId = `${scenario.prefix}-session-realtime`;
  const realtimeTitle = `Sesi ${scenario.prefix} Realtime`;
  const range = currentTimeRange();

  scenario.paths.push(`sessions/${realtimeSessionId}`);
  await getAdminDb()
    .collection('sessions')
    .doc(realtimeSessionId)
    .set({
      classId: scenario.classId,
      laboratoryId: scenario.secondLabId,
      title: realtimeTitle,
      date: scenario.date,
      startTime: range.startTime,
      endTime: range.endTime,
      room: 'B201',
      assistantId: 'e2e-asisten',
      assistantName: 'Asisten Satu',
      status: 'scheduled',
    });

  await loginPraktikan(page);
  const card = await openLabOnMap(page, secondLabName);

  await expect(card.getByText('SEKARANG', { exact: true })).toBeVisible();
  await expect(card.getByText(realtimeTitle, { exact: true })).toBeVisible();
  await expect(card.getByText('Belum dibuka', { exact: true })).toBeVisible();

  await setSessionStatus(realtimeSessionId, 'open');
  await expect(card.getByText('Dibuka', { exact: true })).toBeVisible();

  await setSessionStatus(realtimeSessionId, 'closed');
  await expect(card.getByText('Ditutup', { exact: true })).toBeVisible();
});

test('[UAT-MAP-10] tidak ada lab aktif', { tag: '@uat' }, async ({ page }) => {
  const db = getAdminDb();
  const snapshot = await db.collection('laboratories').where('isActive', '==', true).get();
  const activeIds = snapshot.docs.map((doc) => doc.id);
  expect(activeIds.length).toBeGreaterThan(0);

  try {
    await Promise.all(activeIds.map((id) => setLabActive(id, false)));
    await login(page, 'praktikan1@test.local');
    await waitForPraktikanHome(page);
    await page.goto('/peta');
    await expect(page.getByText('Belum ada laboratorium', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
  } finally {
    await Promise.all(activeIds.map((id) => setLabActive(id, true)));
  }
});

test('[UAT-MAP-11] web list mode', { tag: '@uat' }, async ({ page, scenario }) => {
  const labName = `Lab ${scenario.prefix}`;
  const secondLabName = `Lab ${scenario.prefix} 2`;

  await loginPraktikan(page);
  await page.goto('/peta');
  await expect(page.getByText('Peta Laboratorium', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tampilkan peta' })).toBeVisible();
  await expect(page.getByTitle('Peta Laboratorium OpenStreetMap')).toHaveCount(0);

  await expect(labRow(page, labName)).toBeVisible({ timeout: 30_000 });
  await expect(labRow(page, secondLabName)).toBeVisible();
  await expect(labRow(page, labName)).toContainText('Sekarang:');
  await expect(labRow(page, secondLabName)).toContainText('Belum ada praktikum terjadwal');

  const rows = page.getByRole('button', { name: /radius .*\./ });
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(2);
  for (let index = 0; index < count; index += 1) {
    expect(await rows.nth(index).innerText()).toMatch(
      /Sekarang:|Berikutnya:|Belum ada praktikum terjadwal/,
    );
  }
});

test('[UAT-MAP-12] toggle daftar peta', { tag: '@uat' }, async ({ page, scenario }) => {
  const labName = `Lab ${scenario.prefix}`;
  const iframe = page.getByTitle('Peta Laboratorium OpenStreetMap');
  const fallback = page.getByText(FALLBACK_TEXT, { exact: true });

  await loginPraktikan(page);
  await page.goto('/peta');
  await expect(labRow(page, labName)).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Tampilkan peta' }).click();
  await expect(iframe.or(fallback)).toBeVisible({ timeout: 15_000 });

  if (!(await fallback.isVisible())) {
    await expect(iframe).toBeVisible();
    await page.getByRole('button', { name: 'Daftar' }).click();
  }

  await expect(labRow(page, labName)).toBeVisible();
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function labRow(page: Page, name: string) {
  return page.getByRole('button', {
    name: new RegExp(`^${escapeRegExp(name)},`),
  });
}

function wibRange(start: string, end: string): string {
  return `${start.replace(/:/g, '.')}–${end.replace(/:/g, '.')} WIB`;
}

async function loginPraktikan(page: Page): Promise<void> {
  await login(page, 'praktikan1@test.local');
  await waitForPraktikanHome(page);
}

async function openLabOnMap(page: Page, labName: string) {
  await page.goto('/peta');
  await expect(page.getByText('Peta Laboratorium', { exact: true })).toBeVisible();

  const row = labRow(page, labName);
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.click();

  const card = page.getByLabel(`Detail ${labName}`);
  await expect(card).toBeVisible();
  return card;
}
