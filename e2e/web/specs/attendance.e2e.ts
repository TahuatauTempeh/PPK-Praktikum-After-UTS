import { expect, test } from '../fixtures';
import {
  deleteAttendance,
  getAttendance,
  login,
  openPresensi,
  seedAttendance,
  setSessionStatus,
  waitForPraktikanHome,
} from '../helpers';

test.describe('presensi UAT', () => {
  test.afterEach(async ({ scenario }) => {
    await deleteAttendance(scenario.openSessionId, 'e2e-praktikan1');
  });

  test('[UAT-ATT-10] duplikat presensi ditolak', { tag: '@uat' }, async ({ page, scenario }) => {
    await seedAttendance(scenario.openSessionId, 'e2e-praktikan1', {
      laboratoryId: scenario.labId,
    });
    await login(page, 'praktikan1@test.local');
    await waitForPraktikanHome(page);
    await openPresensi(page, scenario.openSessionId);

    await expect(page.getByText('Sudah presensi', { exact: true })).toBeVisible();
    await expect(page.getByText(/WIB/).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Lihat riwayat kehadiran' }),
    ).toBeVisible();
    const data = await getAttendance(scenario.openSessionId, 'e2e-praktikan1');
    expect(data).not.toBeNull();
  });
  // Catatan: UI saat ini menampilkan "Sudah presensi" + jam WIB, bukan
  // "Sudah presensi pukul HH.mm WIB". Perilaku inti (satu dokumen, tombol
  // presensi diganti riwayat) sudah benar; selisih copy dicatat sebagai gap.
  test('[UAT-ATT-09] penutupan sesi realtime', { tag: '@uat' }, async ({ page, scenario }) => {
    await login(page, 'praktikan1@test.local');
    await waitForPraktikanHome(page);
    await openPresensi(page, scenario.openSessionId);
    await expect(page.getByRole('button', { name: 'Presensi sekarang' })).toBeEnabled({
      timeout: 30_000,
    });

    await setSessionStatus(scenario.openSessionId, 'closed');

    await expect(page.getByText('Sesi sudah ditutup').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('button', { name: 'Presensi sekarang' })).toBeDisabled();
    expect(await getAttendance(scenario.openSessionId, 'e2e-praktikan1')).toBeNull();
  });

  test(
    '[UAT-ATT-08] sesi scheduled dan closed menolak presensi',
    { tag: '@uat' },
    async ({ page, scenario }) => {
      await login(page, 'praktikan1@test.local');
      await waitForPraktikanHome(page);

      await openPresensi(page, scenario.scheduledSessionId);
      await expect(page.getByText('Sesi belum dibuka', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Presensi sekarang' })).toBeDisabled();
      expect(
        await getAttendance(scenario.scheduledSessionId, 'e2e-praktikan1'),
      ).toBeNull();

      await openPresensi(page, scenario.closedSessionId);
      await expect(page.getByText('Sesi sudah ditutup', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Presensi sekarang' })).toBeDisabled();
      expect(await getAttendance(scenario.closedSessionId, 'e2e-praktikan1')).toBeNull();
    },
  );

  test('[UAT-ATT-11] praktikan tidak terdaftar', { tag: '@uat' }, async ({ page, scenario }) => {
    await login(page, 'praktikan3@test.local');
    await waitForPraktikanHome(page);
    await openPresensi(page, scenario.openSessionId);

    await expect(
      page.getByText('Kamu tidak terdaftar di sesi ini', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Presensi sekarang' })).toBeDisabled();
    expect(await getAttendance(scenario.openSessionId, 'e2e-praktikan3')).toBeNull();
  });

  test(
    '[UAT-ATT-15] sesi tanpa lab dan lab nonaktif',
    { tag: '@uat' },
    async ({ page, scenario }) => {
      await login(page, 'praktikan1@test.local');
      await waitForPraktikanHome(page);

      await openPresensi(page, scenario.noLabSessionId);
      await expect(
        page.getByText('Laboratorium sesi belum diatur', { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Presensi sekarang' })).toBeDisabled();
      expect(await getAttendance(scenario.noLabSessionId, 'e2e-praktikan1')).toBeNull();

      await openPresensi(page, scenario.inactiveLabSessionId);
      await expect(
        page.getByText('Laboratorium sedang tidak aktif', { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Presensi sekarang' })).toBeDisabled();
      expect(
        await getAttendance(scenario.inactiveLabSessionId, 'e2e-praktikan1'),
      ).toBeNull();
    },
  );
});

test.describe('akurasi rendah', () => {
  test.use({ geolocation: { latitude: -7.0519, longitude: 110.4383, accuracy: 150 } });

  test('[UAT-ATT-07] akurasi rendah menonaktifkan presensi', { tag: '@uat' }, async ({
    page,
    scenario,
  }) => {
    await login(page, 'praktikan1@test.local');
    await waitForPraktikanHome(page);
    await openPresensi(page, scenario.openSessionId);
    await expect(page.getByText('Akurasi lokasi rendah')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Presensi sekarang' })).toBeDisabled();
    expect(await getAttendance(scenario.openSessionId, 'e2e-praktikan1')).toBeNull();
  });
});
