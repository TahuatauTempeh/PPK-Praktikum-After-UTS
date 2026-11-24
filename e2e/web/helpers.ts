import { expect, type Page } from '@playwright/test';
import { deleteApp, getApps, initializeApp } from 'firebase-admin/app';
import {
  getFirestore,
  type DocumentData,
  type Firestore,
} from 'firebase-admin/firestore';

export const E2E_PASSWORD = 'e2e-password';
const VERIFY_APP = 'e2e-verify';

let adminDb: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (!adminDb) {
    const existing = getApps().find((app) => app.name === VERIFY_APP);
    const app = existing ?? initializeApp({ projectId: 'demo-ppk-e2e' }, VERIFY_APP);
    adminDb = getFirestore(app);
  }
  return adminDb;
}

export async function closeAdminDb(): Promise<void> {
  const apps = getApps().filter((app) => app.name === VERIFY_APP);
  await Promise.all(apps.map((app) => deleteApp(app)));
  adminDb = null;
}

export async function login(
  page: Page,
  email: string,
  password: string = E2E_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.getByPlaceholder('nama@email.com').fill(email);
  await page.getByPlaceholder('Minimal 6 karakter').fill(password);
  await page.getByRole('button', { name: 'Masuk' }).click();
}

export const loginAs = login;

export async function logout(page: Page): Promise<void> {
  await page.goto('/profil');
  await page.getByRole('button', { name: 'Keluar dari akun' }).click();
  await page.getByText('Ya', { exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}

export async function waitForPraktikanHome(page: Page): Promise<void> {
  await expect(page.getByText('Daftar sesi')).toBeVisible();
}

export async function waitForAsistenHome(page: Page): Promise<void> {
  await expect(page.getByText('MENU', { exact: true })).toBeVisible();
}

export async function openPresensi(page: Page, sessionId: string): Promise<void> {
  await page.goto(`/praktikan/presensi/${sessionId}`);
  await expect(page.getByText('Presensi', { exact: true })).toBeVisible();
}

export async function deleteAttendance(
  sessionId: string,
  uid: string,
): Promise<void> {
  await getAdminDb().collection('attendance').doc(`${sessionId}_${uid}`).delete();
}

export async function getAttendance(
  sessionId: string,
  uid: string,
): Promise<DocumentData | null> {
  const snapshot = await getAdminDb()
    .collection('attendance')
    .doc(`${sessionId}_${uid}`)
    .get();
  return snapshot.data() ?? null;
}

export async function getSessionByTitle(
  title: string,
): Promise<(DocumentData & { id: string }) | null> {
  const snapshot = await getAdminDb()
    .collection('sessions')
    .where('title', '==', title)
    .get();
  return snapshot.docs[0]
    ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
    : null;
}

export async function getPermissionByReason(
  reason: string,
): Promise<DocumentData | undefined> {
  const snapshot = await getAdminDb()
    .collection('permissionRequests')
    .where('reason', '==', reason)
    .get();
  return snapshot.docs[0]?.data();
}
